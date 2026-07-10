import { UserRepository } from './userRepository.js';
import { MechanicRepository } from './mechanicRepository.js';
import { BookingRepository } from './bookingRepository.js';
import { EmergencyRepository } from './emergencyRepository.js';
import { PaymentRepository } from './paymentRepository.js';
import { NotificationRepository } from './notificationRepository.js';
import { ServiceRepository } from './serviceRepository.js';
import { EmergencyTypeRepository } from './emergencyTypeRepository.js';
import { AuditRepository } from './auditRepository.js';
import { ActiveJobRepository } from './activeJobRepository.js';
import { ChatRepository } from './chatRepository.js';

/**
 * Repository instances - initialized with database reference.
 * Call initRepositories(db) after database is initialized.
 */
let repositories = {};

export function initRepositories(db) {
  repositories = {
    users: new UserRepository(db),
    mechanics: new MechanicRepository(db),
    bookings: new BookingRepository(db),
    emergencies: new EmergencyRepository(db),
    payments: new PaymentRepository(db),
    notifications: new NotificationRepository(db),
    services: new ServiceRepository(db),
    emergencyTypes: new EmergencyTypeRepository(db),
    audit: new AuditRepository(db),
    activeJobs: new ActiveJobRepository(db),
    chat: new ChatRepository(db),
  };
  return repositories;
}

export function getRepositories() {
  return repositories;
}

export {
  UserRepository,
  MechanicRepository,
  BookingRepository,
  EmergencyRepository,
  PaymentRepository,
  NotificationRepository,
  ServiceRepository,
  EmergencyTypeRepository,
  AuditRepository,
  ActiveJobRepository,
  ChatRepository,
};
