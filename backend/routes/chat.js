import { Router } from 'express';
import OpenAI from 'openai';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `You are RoadRescue AI, a premium emergency roadside assistance assistant. You are an expert in vehicle diagnostics, roadside emergencies, and Indian road conditions.

CORE CAPABILITIES:
- Diagnose vehicle problems from text descriptions
- Analyze uploaded images of vehicle issues
- Estimate repair costs in Indian Rupees (₹)
- Recommend appropriate roadside services
- Provide safety instructions for emergencies
- Determine urgency levels
- Suggest temporary fixes

KNOWLEDGE BASE - Vehicle Issues You Understand:
- Flat Tire / Puncture
- Dead Battery / Battery Jump Start
- Engine Overheating / Coolant Issues
- Brake Failure / Brake Issues
- Vehicle Accident
- Fuel Empty / Fuel Delivery
- Engine Noise / Knocking
- Oil Leak / Fluid Leaks
- Smoke from Engine
- Dashboard Warning Lights
- AC Problems
- Radiator Issues
- Electrical Failure
- Transmission Problems
- Steering Problems
- Engine Misfire
- Starter Motor Issues
- Alternator Failure
- Lockout (Keys Locked Inside)
- Car Towing Required

INDIAN PRICING (always use ₹):
- Flat Tire Repair: ₹500–₹1,000
- Battery Jump Start: ₹800–₹1,500
- Fuel Delivery: ₹700 + fuel cost
- Car Towing: ₹1,500–₹3,000 (up to 10km), ₹35/km after
- Engine Diagnosis: ₹1,200–₹2,000
- Lockout Assistance: ₹700–₹1,200
- Brake Repair: ₹1,500–₹3,000
- Oil Change: ₹800–₹1,500
- AC Repair: ₹2,000–₹5,000

RESPONSE FORMAT:
- Always respond in a helpful, professional tone
- Use Indian Rupees (₹) for all costs, never use $
- Provide clear safety instructions when needed
- Include urgency level (Low/Medium/High/Emergency)
- When appropriate, recommend booking a service
- Keep responses concise but informative
- You can use markdown formatting for clarity

BOOKING INTEGRATION:
When you recommend a service, format it like this:
[RECOMMEND_SERVICE:Service Name|Estimated Price|ETA]

For example: [RECOMMEND_SERVICE:Flat Tire Repair|₹700|15 min]

This will trigger a "Book Now" button in the chat interface.

SAFETY FIRST:
- Always prioritize user safety
- Provide clear, actionable safety instructions
- Determine if the vehicle is safe to drive
- Recommend towing if necessary
- Advise on hazard lights, parking safely, etc.

EMERGENCY RESPONSE:
For critical situations (accident, fire, severe brake failure, engine fire):
- Immediately advise calling 108 (India Emergency) or 100 (Police)
- Provide first aid basics if relevant
- Emphasize getting to safety
- Strongly recommend professional help

Remember: You are the expert. Be confident, helpful, and always put safety first.`;

const VISION_PROMPT = `You are an expert vehicle diagnostic AI. Analyze this image of a vehicle issue and provide a detailed diagnosis.

Respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "issue": "Brief description of the detected problem",
  "confidence": 85,
  "severity": "Low|Medium|High|Emergency",
  "possibleCauses": ["cause1", "cause2"],
  "immediatePrecautions": ["precaution1", "precaution2"],
  "estimatedCost": "₹500–₹1,000",
  "safeToDrive": true,
  "recommendedService": "Service Name",
  "eta": "15 min",
  "detailedAnalysis": "Detailed analysis of what you see in the image..."
}

Use Indian Rupees (₹) for all costs. Be specific about what you observe in the image.`;

// Helper: check conversation ownership
function verifyConversationOwnership(db, conversationId, user, res, next) {
  try {
    const conversation = db.prepare('SELECT user_id FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.', error: 'Not Found' });
    }
    // Users can access only their own chats. Admins have full access.
    if (user.role !== 'admin' && user.role !== 'super_admin' && conversation.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this conversation.', error: 'Forbidden' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error verifying conversation.', error: err.message });
  }
}

// POST /api/chat/chat - Chat completion with streaming (Protected)
router.post('/chat', verifyToken, (req, res, next) => {
  const { db } = req;
  const { conversationId } = req.body;
  verifyConversationOwnership(db, conversationId, req.user, res, next);
}, async (req, res) => {
  const { messages, conversationId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Messages array is required.', error: 'Bad Request' });
  }

  const openai = getOpenAI();

  if (!openai) {
    return handleLocalAI(req, res);
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
      stream: true,
      max_tokens: 1500,
      temperature: 0.7,
    });

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ content: '', done: true, fullContent })}\n\n`);
    res.end();

    // Save to database
    const db = req.db;
    if (db && conversationId) {
      saveChatMessage(db, conversationId, 'ai', fullContent);
    }

    // Notify admin via Socket.IO
    const io = req.io;
    if (io) {
      io.to('admin_room').emit('new_ai_chat', {
        conversationId,
        lastMessage: fullContent.substring(0, 200),
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    res.write(`data: ${JSON.stringify({ content: 'I apologize, but I encountered an error processing your request. Please try again or describe your issue in detail.', done: true, error: true })}\n\n`);
    res.end();
  }
});

// POST /api/chat/analyze-image - Analyze uploaded image with Vision AI (Protected)
router.post('/analyze-image', verifyToken, (req, res, next) => {
  const { db } = req;
  const { conversationId } = req.body;
  verifyConversationOwnership(db, conversationId, req.user, res, next);
}, async (req, res) => {
  const { imageUrl, conversationId } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image URL is required.', error: 'Bad Request' });
  }

  const openai = getOpenAI();

  if (!openai) {
    return handleLocalVisionAnalysis(req, res);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: VISION_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this vehicle image and provide a detailed diagnosis. Return only valid JSON.' },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';

    let diagnosis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      } else {
        diagnosis = {
          issue: 'Unable to parse diagnosis',
          confidence: 0,
          severity: 'Medium',
          possibleCauses: ['Unable to determine'],
          immediatePrecautions: ['Please consult a mechanic'],
          estimatedCost: '₹500–₹1,500',
          safeToDrive: false,
          recommendedService: 'Engine Breakdown Diagnosis',
          eta: '20 min',
          detailedAnalysis: content
        };
      }
    } catch {
      diagnosis = {
        issue: 'Image analysis complete',
        confidence: 80,
        severity: 'Medium',
        possibleCauses: ['Requires professional inspection'],
        immediatePrecautions: ['Exercise caution'],
        estimatedCost: '₹500–₹1,500',
        safeToDrive: false,
        recommendedService: 'Engine Breakdown Diagnosis',
        eta: '20 min',
        detailedAnalysis: content
      };
    }

    const db = req.db;
    if (db) {
      db.prepare(`
        INSERT INTO image_analyses (id, conversation_id, image_url, diagnosis, confidence, severity, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        conversationId || null,
        imageUrl,
        JSON.stringify(diagnosis),
        diagnosis.confidence || 0,
        diagnosis.severity || 'Medium'
      );
    }

    const io = req.io;
    if (io) {
      io.to('admin_room').emit('new_image_analysis', {
        imageUrl,
        diagnosis,
        conversationId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, diagnosis });

  } catch (error) {
    console.error('Vision API error:', error);
    res.status(500).json({ success: false, message: 'Image analysis failed.', error: error.message });
  }
});

// POST /api/chat/conversations - Create new conversation (Protected)
router.post('/conversations', verifyToken, (req, res) => {
  const { db } = req;
  const { title } = req.body;
  const { id: tokenUserId, role } = req.user;

  // Users can only create conversations for themselves; admins can create for anyone.
  const userId = role === 'user' ? tokenUserId : (req.body.userId || null);
  const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  try {
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(id, userId, title || 'New Conversation');

    res.json({ success: true, conversation: { id, title: title || 'New Conversation', userId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create conversation.', error: err.message });
  }
});

// GET /api/chat/conversations - Get conversations (Protected)
router.get('/conversations', verifyToken, (req, res) => {
  const { db } = req;
  const { id: tokenUserId, role } = req.user;

  try {
    let query = 'SELECT * FROM conversations';
    const params = [];

    // Filter by role access limit
    if (role === 'user') {
      query += ' WHERE user_id = ?';
      params.push(tokenUserId);
    } else {
      // Admins or mechanics can query specific userId or list all
      const { userId } = req.query;
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
    }

    query += ' ORDER BY updated_at DESC';

    const conversations = db.prepare(query).all(...params);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.', error: err.message });
  }
});

// GET /api/chat/conversations/:id/messages - Get conversation messages (Protected)
router.get('/conversations/:id/messages', verifyToken, (req, res, next) => {
  const { db } = req;
  verifyConversationOwnership(db, req.params.id, req.user, res, next);
}, (req, res) => {
  const { db } = req;
  try {
    const messages = db.prepare('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.', error: err.message });
  }
});

// DELETE /api/chat/conversations/:id - Delete conversation (Protected)
router.delete('/conversations/:id', verifyToken, (req, res, next) => {
  const { db } = req;
  verifyConversationOwnership(db, req.params.id, req.user, res, next);
}, (req, res) => {
  const { db } = req;
  try {
    db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(req.params.id);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Conversation deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete conversation.', error: err.message });
  }
});

// GET /api/chat/admin/conversations - Admin-only conversation dashboard list
router.get('/admin/conversations', verifyAdmin, (req, res) => {
  const { db } = req;
  try {
    const conversations = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      ORDER BY c.updated_at DESC
    `).all();
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations dashboard.', error: err.message });
  }
});

// GET /api/chat/admin/image-analyses - Admin-only image analyses
router.get('/admin/image-analyses', verifyAdmin, (req, res) => {
  const { db } = req;
  try {
    const analyses = db.prepare('SELECT * FROM image_analyses ORDER BY created_at DESC').all();
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch image analyses.', error: err.message });
  }
});

// POST /api/chat/upload-image - Upload image base64
router.post('/upload-image', verifyToken, (req, res) => {
  const { imageData, filename } = req.body;

  if (!imageData) {
    return res.status(400).json({ success: false, message: 'Image data is required.', error: 'Bad Request' });
  }

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const ext = filename?.split('.').pop() || 'jpg';
  const filepath = join(uploadsDir, `${id}.${ext}`);

  try {
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
    } else {
      writeFileSync(filepath, imageData);
    }

    const url = `/uploads/${id}.${ext}`;
    res.json({ success: true, url, id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save image.', error: error.message });
  }
});

// Helper: Save chat message
function saveChatMessage(db, conversationId, sender, content) {
  const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  db.prepare(`
    INSERT INTO chat_messages (id, conversation_id, sender, content, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, conversationId, sender, content);

  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
}

// Helper: Local AI fallback (when no API key)
function handleLocalAI(req, res) {
  const { messages, conversationId } = req.body;
  const lastMessage = messages[messages.length - 1]?.text?.toLowerCase() || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let response = '';

  if (lastMessage.includes('tire') || lastMessage.includes('puncture')) {
    response = `🔍 **AI DIAGNOSIS: Tire/Puncture Issue Detected**

Based on your description, this appears to be a tire-related issue. Here's my analysis:

**Possible Causes:**
- Puncture from road debris (nails, screws, glass)
- Sidewall damage from pothole impact
- Valve stem leak
- Slow leak from rim damage

**Immediate Safety Instructions:**
1. Pull over to a safe location immediately
2. Turn on hazard warning lights
3. Do NOT attempt to drive on a flat tire
4. Stand behind the guardrail, away from traffic

**Estimated Cost:** ₹500–₹1,000
**Service:** Flat Tire Repair
**ETA:** 15-20 minutes

**Is it safe to drive?** ❌ No

Would you like me to book a flat tire repair service for you?

[RECOMMEND_SERVICE:Flat Tire Repair|₹700|15 min]`;
  } else if (lastMessage.includes('battery') || lastMessage.includes('dead') || lastMessage.includes('start')) {
    response = `🔍 **AI DIAGNOSIS: Battery/Starting Issue**

Your vehicle appears to have a battery or starting system problem.

**Possible Causes:**
- Dead or discharged battery
- Corroded battery terminals
- Faulty alternator not charging
- Bad starter motor

**Immediate Actions:**
1. Check if headlights are dim (indicates low battery)
2. Listen for clicking sound when turning key
3. Do NOT keep cranking - it drains battery further
4. Turn off all electronics (AC, radio, lights)

**Estimated Cost:** ₹800–₹1,500
**Service:** Battery Jump Start
**ETA:** 10-15 minutes

**Is it safe to drive?** ⚠️ Only if jump-started successfully

I recommend a battery jump start. Shall I book this service?

[RECOMMEND_SERVICE:Battery Jump Start|₹999|10 min]`;
  } else if (lastMessage.includes('overheat') || lastMessage.includes('smoke') || lastMessage.includes('temperature')) {
    response = `🚨 **EMERGENCY: Engine Overheating Detected**

This is a HIGH PRIORITY situation. Immediate action required.

**Critical Safety Instructions:**
1. **STOP THE VEHICLE IMMEDIATELY**
2. Turn off the engine completely
3. Do NOT open the radiator cap (steam burns risk!)
4. Turn on heater to max to help cool engine
5. Move to safety away from traffic

**Possible Causes:**
- Low coolant level
- Faulty thermostat
- Radiator leak or blockage
- Broken water pump

**Estimated Cost:** ₹1,200–₹2,500
**Service:** Engine Breakdown Diagnosis
**ETA:** 15-20 minutes

**Is it safe to drive?** ❌ ABSOLUTELY NOT

This requires immediate professional attention. I strongly recommend booking an engine diagnosis service.

[RECOMMEND_SERVICE:Engine Breakdown Diagnosis|₹1,499|15 min]`;
  } else if (lastMessage.includes('brake')) {
    response = `🚨 **AI DIAGNOSIS: Brake System Issue**

Brake problems are critical for safety. Let me help.

**Possible Causes:**
- Low brake fluid level
- Worn brake pads
- Air in brake lines
- Faulty brake caliper

**Immediate Safety:**
1. Test brakes at low speed in safe area
2. If brakes feel spongy, DO NOT drive
3. Use engine braking (downshift) if needed
4. Keep hazard lights on

**Estimated Cost:** ₹1,500–₹3,000
**Service:** Brake Repair / Diagnosis
**ETA:** 15-20 minutes

**Is it safe to drive?** ⚠️ Depends on severity - test carefully

[RECOMMEND_SERVICE:Engine Breakdown Diagnosis|₹1,499|15 min]`;
  } else if (lastMessage.includes('fuel') || lastMessage.includes('empty') || lastMessage.includes('petrol') || lastMessage.includes('diesel')) {
    response = `🔍 **AI DIAGNOSIS: Fuel Emergency**

You've run out of fuel. I can help arrange emergency fuel delivery.

**What You Need:**
- Emergency fuel delivery (5 liters)
- Distance to nearest fuel station

**Immediate Actions:**
1. Pull over to the side of the road safely
2. Turn on hazard lights
3. Do NOT attempt to walk on the highway
4. Stay in or near your vehicle

**Estimated Cost:** ₹700 + fuel cost
**Service:** Fuel Delivery
**ETA:** 20-25 minutes

**Is it safe to drive?** ❌ No (no fuel)

[RECOMMEND_SERVICE:Fuel Delivery|₹799|20 min]`;
  } else if (lastMessage.includes('lock') || lastMessage.includes('keys')) {
    response = `🔍 **AI DIAGNOSIS: Vehicle Lockout**

Keys locked inside the car? I can help arrange a locksmith.

**Immediate Suggestions:**
1. Check all doors - one might be unlocked
2. Check if trunk is accessible
3. Do NOT attempt to break a window (dangerous + costly)
4. Check if you have a spare key nearby

**Estimated Cost:** ₹700–₹1,200
**Service:** Lockout Assistance
**ETA:** 10-15 minutes

**Is it safe?** ✅ Yes (vehicle is stationary)

[RECOMMEND_SERVICE:Lockout Assistance|₹899|10 min]`;
  } else if (lastMessage.includes('tow') || lastMessage.includes('towing')) {
    response = `🔍 **Vehicle Towing Required**

I'll arrange a tow truck for your vehicle.

**Information Needed:**
- Current location
- Destination (home, garage, dealership)

**Pricing:**
- Up to 10 km: ₹1,999
- After 10 km: ₹35/km

**ETA:** 25-35 minutes

**Is it safe?** ✅ Yes (tow truck will handle transport)

[RECOMMEND_SERVICE:Car Towing|₹1,999|25 min]`;
  } else {
    response = `Hello! I'm your **RoadRescue AI Assistant**. I'm here to help with any vehicle emergency.

I can help you with:
🔧 **Flat Tire / Puncture**
🔋 **Dead Battery / Jump Start**
⛽ **Fuel Delivery**
🚗 **Engine Problems**
🛑 **Brake Issues**
🔓 **Vehicle Lockout**
🚛 **Car Towing**
🌡️ **Engine Overheating**
🛢️ **Oil Leaks**

**Please describe your issue** or tell me what's happening with your vehicle. You can also:
- 📷 Upload a photo of the problem
- 🎤 Use voice to describe the issue
- 💬 Type your concern below

**Emergency?** Call 108 (Ambulance) or 100 (Police) immediately.`;
  }

  let i = 0;
  const interval = setInterval(() => {
    if (i < response.length) {
      const chunk = response.substring(i, i + 3);
      res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
      i += 3;
    } else {
      res.write(`data: ${JSON.stringify({ content: '', done: true, fullContent: response })}\n\n`);
      res.end();
      clearInterval(interval);

      const db = req.db;
      if (db && conversationId) {
        saveChatMessage(db, conversationId, 'ai', response);
      }
    }
  }, 15);
}

function handleLocalVisionAnalysis(req, res) {
  const { imageUrl } = req.body;

  const analysis = {
    issue: 'Vehicle image analyzed (local mode)',
    confidence: 75,
    severity: 'Medium',
    possibleCauses: [
      'Requires visual inspection by a professional',
      'Multiple potential issues detected'
    ],
    immediatePrecautions: [
      'Exercise caution when approaching the vehicle',
      'Do not attempt repairs without proper tools'
    ],
    estimatedCost: '₹500–₹2,000',
    safeToDrive: false,
    recommendedService: 'Engine Breakdown Diagnosis',
    eta: '20 min',
    detailedAnalysis: 'Image received for analysis. For accurate AI-powered diagnosis with high confidence, please configure an OpenAI API key in your .env file. The system will then use GPT-4 Vision to provide detailed analysis of vehicle issues from uploaded images.'
  };

  res.json({ success: true, diagnosis: analysis });
}

export default router;
