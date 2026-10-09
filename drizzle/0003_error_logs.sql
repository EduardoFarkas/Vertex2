CREATE TABLE `error_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `requestId` varchar(64) NOT NULL,
  `action` varchar(80) NOT NULL,
  `route` varchar(255) NOT NULL,
  `code` varchar(80) NOT NULL,
  `message` varchar(500) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `error_logs_id` PRIMARY KEY(`id`),
  CONSTRAINT `error_logs_requestId_unique` UNIQUE(`requestId`),
  KEY `error_log_user_created_idx` (`userId`, `createdAt`),
  CONSTRAINT `error_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
