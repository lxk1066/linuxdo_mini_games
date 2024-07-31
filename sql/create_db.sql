-- Active: 1710679474232@@127.0.0.1@3306@hello_nest

CREATE TABLE `user` (
    `id` int(11) NOT NULL AUTO_INCREMENT, `username` varchar(255) DEFAULT NULL, `password` varchar(255) DEFAULT NULL, PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4;