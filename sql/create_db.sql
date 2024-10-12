/*
Navicat Premium Data Transfer
Source Server         : linuxdo mini games
Source Server Type    : MySQL
Source Server Version : 80037
Source Host           : xxx.com:3306
Source Schema         : linuxdo_mini_games
Target Server Type    : MySQL
Target Server Version : 80037
File Encoding         : 65001
Date: 12/10/2024 20:10:12
*/


-- ----------------------------
-- Create database and use
-- ----------------------------
CREATE DATABASE `linuxdo_mini_games` IF NOT EXISTS;
USE `linuxdo_mini_games`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for game
-- ----------------------------
DROP TABLE IF EXISTS `game`;
CREATE TABLE `game`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '游戏ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '游戏名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '游戏介绍',
  `author` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'own' COMMENT '游戏作者',
  `authorContact` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '游戏作者的联系方式',
  `create_time` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_time` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '游戏页面对应的路径',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of game
-- ----------------------------
INSERT INTO `game` VALUES (1, '贪吃蛇', '贪吃蛇小游戏', 'own', '', '2024-08-10 23:52:31.699408', '2024-08-11 02:33:07.083663', '/games/snake/index.html');

SET FOREIGN_KEY_CHECKS = 1;
