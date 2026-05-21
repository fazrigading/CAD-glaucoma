-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 19, 2025 at 08:57 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cad_glaucoma_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `predict`
--

CREATE TABLE `predict` (
  `id` int(11) NOT NULL,
  `patient_name` varchar(100) NOT NULL,
  `age` int(11) NOT NULL,
  `gender` enum('Laki-laki','Perempuan') NOT NULL,
  `eyes_position` enum('Kanan','Kiri') NOT NULL,
  `raw_img_path` varchar(255) NOT NULL,
  `mask_img_path` varchar(255) NOT NULL,
  `annot_img_path` varchar(255) NOT NULL,
  `h_cdr` float NOT NULL,
  `v_cdr` float NOT NULL,
  `area_cdr` float NOT NULL,
  `diagnose` enum('Glaucoma','Non Glaucoma') NOT NULL,
  `disc_class` text DEFAULT NULL,
  `cup_class` text DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `predict`
--

INSERT INTO `predict` (`id`, `patient_name`, `age`, `gender`, `eyes_position`, `raw_img_path`, `mask_img_path`, `annot_img_path`, `h_cdr`, `v_cdr`, `area_cdr`, `diagnose`, `disc_class`, `cup_class`, `doctor_id`, `created_time`) VALUES
(15, 'Jubaidah', 70, 'Perempuan', 'Kanan', 'uploads/raw\\15_raw.jpg', 'uploads/mask\\15_masking.jpg', 'uploads/annot\\15_draw_mask.jpg', 0.44, 0.56, 0.26, 'Glaucoma', NULL, NULL, NULL, '2025-08-20 13:34:52'),
(16, 'Maimunah', 67, 'Perempuan', 'Kiri', 'uploads/raw\\16_raw.jpg', 'uploads/mask\\16_masking.jpg', 'uploads/annot\\16_draw_mask.jpg', 0.38, 0.43, 0.18, 'Non Glaucoma', NULL, NULL, NULL, '2025-08-20 15:52:21'),
(18, 'Farah', 67, 'Perempuan', 'Kanan', 'uploads/raw\\18_raw.jpg', 'uploads/mask\\18_masking.jpg', 'uploads/annot\\18_draw_mask.jpg', 0.44, 0.56, 0.26, 'Glaucoma', NULL, NULL, NULL, '2025-08-31 10:47:35'),
(19, 'Ahmad Syahroni', 87, 'Laki-laki', 'Kiri', 'uploads/raw\\19_raw.jpg', 'uploads/mask\\19_masking.jpg', 'uploads/annot\\19_draw_mask.jpg', 0.38, 0.43, 0.18, 'Non Glaucoma', NULL, NULL, NULL, '2025-08-31 12:15:08'),
(20, 'Nafa Ubach', 76, 'Perempuan', 'Kiri', 'uploads/raw\\20_raw.jpg', 'uploads/mask\\20_masking.jpg', 'uploads/annot\\20_draw_mask.jpg', 0.64, 0.57, 0.37, 'Glaucoma', '[{\"id\": \"1756653584272\", \"label\": \"disc\", \"points\": [{\"x\": 452, \"y\": 340.9875030517578}, {\"x\": 458, ', '[{\"id\": \"1756653594301\", \"label\": \"cup\", \"points\": [{\"x\": 464, \"y\": 344.9875030517578}, {\"x\": 474, \"', NULL, '2025-08-31 12:22:29'),
(21, 'Reza abdullah', 56, 'Laki-laki', 'Kiri', 'uploads/raw\\21_raw.jpg', 'uploads/mask\\21_masking.jpg', 'uploads/annot\\21_draw_mask.jpg', 0.88, 0.55, 0.54, 'Glaucoma', '[{\"id\": \"1756647673571\", \"label\": \"disc\", \"points\": [{\"x\": 464, \"y\": 277.9875030517578}, {\"x\": 471, ', '[{\"id\": \"1756647685029\", \"label\": \"cup\", \"points\": [{\"x\": 480, \"y\": 266.9875030517578}, {\"x\": 488, \"', NULL, '2025-08-31 12:27:00'),
(22, 'Suhendri', 57, 'Laki-laki', 'Kanan', 'uploads/raw\\22_raw.jpg', 'uploads/mask\\22_masking.jpg', 'uploads/annot\\22_draw_mask.jpg', 0.69, 0.76, 0.54, 'Glaucoma', '[{\"id\": \"1756904409156\", \"label\": \"disc\", \"points\": [{\"x\": 525.7502587991719, \"y\": 284.7199465342013', '[{\"id\": \"1756904447463\", \"label\": \"cup\", \"points\": [{\"x\": 530.4169254658385, \"y\": 279.0532798675346}', NULL, '2025-08-31 12:33:10'),
(23, 'Mulyono', 56, 'Laki-laki', 'Kanan', 'uploads/raw\\23_raw.jpg', 'uploads/mask\\23_masking.jpg', 'uploads/annot\\23_draw_mask.jpg', 0.73, 0.72, 0.53, 'Glaucoma', '[{\"id\": \"1756904179428\", \"label\": \"disc\", \"points\": [{\"x\": 475, \"y\": 311.9875030517578}, {\"x\": 488, ', '[{\"id\": \"1756904188315\", \"label\": \"cup\", \"points\": [{\"x\": 484, \"y\": 303.9875030517578}, {\"x\": 497, \"', NULL, '2025-09-01 13:31:46'),
(24, 'sajojo', 76, 'Laki-laki', 'Kiri', 'uploads/raw\\24_raw.jpg', 'uploads/mask\\24_masking.jpg', 'uploads/annot\\24_draw_mask.jpg', 0.64, 0.41, 0.27, 'Non Glaucoma', '[{\"id\": \"1756910335892\", \"label\": \"disc\", \"points\": [{\"x\": 456, \"y\": 318.9875030517578}, {\"x\": 463, \"y\": 329.9875030517578}, {\"x\": 473, \"y\": 338.9875030517578}, {\"x\": 480, \"y\": 342.9875030517578}, {\"x\": 494, \"y\": 347.9875030517578}, {\"x\": 508, \"y\": 347.9875030517578}, {\"x\": 521, \"y\": 342.9875030517578}, {\"x\": 532, \"y\": 332.9875030517578}, {\"x\": 537, \"y\": 324.9875030517578}, {\"x\": 540, \"y\": 309.9875030517578}, {\"x\": 538, \"y\": 297.9875030517578}, {\"x\": 528, \"y\": 284.9875030517578}, {\"x\": 517, \"y\": 274.9875030517578}, {\"x\": 503, \"y\": 265.9875030517578}, {\"x\": 489, \"y\": 262.9875030517578}, {\"x\": 479, \"y\": 266.9875030517578}, {\"x\": 468, \"y\": 274.9875030517578}, {\"x\": 458, \"y\": 285.9875030517578}, {\"x\": 456, \"y\": 294.9875030517578}]}]', '[{\"id\": \"1756910347646\", \"label\": \"cup\", \"points\": [{\"x\": 466.3375790875791, \"y\": 306.23355378465067}, {\"x\": 469.3375790875791, \"y\": 316.90022045131735}, {\"x\": 480, \"y\": 322.7875030517578}, {\"x\": 487.20000000000005, \"y\": 324.3875030517578}, {\"x\": 496.8, \"y\": 325.58750305175784}, {\"x\": 508, \"y\": 323.9875030517578}, {\"x\": 515.0042457542457, \"y\": 319.566887117984}, {\"x\": 520.3375790875791, \"y\": 311.566887117984}, {\"x\": 520.3375790875791, \"y\": 302.566887117984}, {\"x\": 514.6709124209125, \"y\": 291.566887117984}, {\"x\": 506.3375790875791, \"y\": 290.90022045131735}, {\"x\": 499, \"y\": 292.9875030517578}, {\"x\": 488, \"y\": 295.1875030517578}, {\"x\": 476.00424575424574, \"y\": 295.566887117984}, {\"x\": 468.67091242091243, \"y\": 297.90022045131735}]}]', 3, '2025-09-03 12:47:06'),
(25, 'Salman', 54, 'Laki-laki', 'Kiri', 'uploads/raw\\25_raw.jpg', 'uploads/mask\\25_masking.jpg', 'uploads/annot\\25_draw_mask.jpg', 0.54, 0.58, 0.31, 'Glaucoma', NULL, NULL, NULL, '2025-09-03 16:07:23'),
(26, 'Rahmat', 55, 'Laki-laki', 'Kiri', 'uploads/raw\\26_raw.jpg', 'uploads/mask\\26_masking.jpg', 'uploads/annot\\26_draw_mask.jpg', 0.62, 0.57, 0.31, 'Glaucoma', '[{\"id\": \"1757508922481\", \"label\": \"disc\", \"points\": [{\"x\": 453, \"y\": 304.9875030517578}, {\"x\": 454, \"y\": 320.9875030517578}, {\"x\": 466, \"y\": 331.9875030517578}, {\"x\": 488, \"y\": 339.9875030517578}, {\"x\": 506, \"y\": 344.9875030517578}, {\"x\": 527, \"y\": 337.9875030517578}, {\"x\": 535, \"y\": 317.9875030517578}, {\"x\": 532, \"y\": 287.9875030517578}, {\"x\": 524, \"y\": 270.9875030517578}, {\"x\": 495, \"y\": 266.9875030517578}, {\"x\": 472, \"y\": 263.9875030517578}, {\"x\": 459, \"y\": 282.9875030517578}]}]', '[{\"id\": \"1757508931508\", \"label\": \"cup\", \"points\": [{\"x\": 469, \"y\": 299.9875030517578}, {\"x\": 473, \"y\": 314.9875030517578}, {\"x\": 491, \"y\": 326.9875030517578}, {\"x\": 510, \"y\": 322.9875030517578}, {\"x\": 520, \"y\": 311.9875030517578}, {\"x\": 516, \"y\": 298.9875030517578}, {\"x\": 510, \"y\": 288.9875030517578}, {\"x\": 492, \"y\": 280.9875030517578}, {\"x\": 477, \"y\": 286.9875030517578}]}]', 1, '2025-09-04 12:54:58'),
(27, 'Samad', 33, 'Laki-laki', 'Kanan', 'uploads/raw\\27_raw.jpg', 'uploads/mask\\27_masking.jpg', 'uploads/annot\\27_draw_mask.jpg', 0.68, 0.42, 0.27, 'Non Glaucoma', '[{\"id\": \"1756991508293\", \"label\": \"disc\", \"points\": [{\"x\": 427, \"y\": 386.9875030517578}, {\"x\": 438, \"y\": 397.9875030517578}, {\"x\": 456, \"y\": 404.9875030517578}, {\"x\": 475, \"y\": 399.9875030517578}, {\"x\": 486, \"y\": 394.9875030517578}, {\"x\": 500, \"y\": 382.9875030517578}, {\"x\": 500, \"y\": 365.9875030517578}, {\"x\": 500, \"y\": 346.9875030517578}, {\"x\": 496, \"y\": 331.9875030517578}, {\"x\": 484, \"y\": 321.9875030517578}, {\"x\": 468, \"y\": 318.9875030517578}, {\"x\": 456, \"y\": 318.9875030517578}, {\"x\": 440, \"y\": 327.9875030517578}, {\"x\": 432, \"y\": 338.9875030517578}, {\"x\": 428, \"y\": 346.9875030517578}, {\"x\": 425, \"y\": 359.9875030517578}, {\"x\": 425, \"y\": 369.9875030517578}]}]', '[{\"id\": \"1756991516892\", \"label\": \"cup\", \"points\": [{\"x\": 436, \"y\": 375.9875030517578}, {\"x\": 448, \"y\": 376.9875030517578}, {\"x\": 460, \"y\": 378.9875030517578}, {\"x\": 474, \"y\": 376.9875030517578}, {\"x\": 487, \"y\": 371.9875030517578}, {\"x\": 487, \"y\": 353.9875030517578}, {\"x\": 481, \"y\": 345.9875030517578}, {\"x\": 469, \"y\": 344.9875030517578}, {\"x\": 459, \"y\": 342.9875030517578}, {\"x\": 448, \"y\": 350.9875030517578}, {\"x\": 442, \"y\": 354.9875030517578}, {\"x\": 440, \"y\": 363.9875030517578}]}]', 1, '2025-09-04 13:10:51'),
(28, 'Example', 55, 'Laki-laki', 'Kanan', 'uploads/raw\\28_raw.jpg', 'uploads/mask\\28_masking.jpg', 'uploads/annot\\28_draw_mask.jpg', 0.61, 0.56, 0.35, 'Glaucoma', '[{\"id\": \"1758157724001\", \"label\": \"disc\", \"points\": [{\"x\": 456, \"y\": 317.9875030517578}, {\"x\": 468, \"y\": 333.9875030517578}, {\"x\": 482, \"y\": 343.9875030517578}, {\"x\": 497, \"y\": 348.9875030517578}, {\"x\": 516, \"y\": 349.9875030517578}, {\"x\": 528, \"y\": 340.9875030517578}, {\"x\": 536, \"y\": 329.9875030517578}, {\"x\": 540, \"y\": 315.9875030517578}, {\"x\": 539, \"y\": 300.9875030517578}, {\"x\": 532, \"y\": 286.9875030517578}, {\"x\": 520, \"y\": 272.9875030517578}, {\"x\": 505, \"y\": 262.9875030517578}, {\"x\": 482, \"y\": 260.9875030517578}, {\"x\": 468, \"y\": 271.9875030517578}, {\"x\": 458, \"y\": 284.9875030517578}, {\"x\": 455, \"y\": 300.9875030517578}]}]', '[{\"id\": \"1758157764503\", \"label\": \"cup\", \"points\": [{\"x\": 468, \"y\": 313.9875030517578}, {\"x\": 480, \"y\": 323.9875030517578}, {\"x\": 494, \"y\": 327.9875030517578}, {\"x\": 512, \"y\": 325.9875030517578}, {\"x\": 520, \"y\": 311.9875030517578}, {\"x\": 517, \"y\": 290.9875030517578}, {\"x\": 504, \"y\": 280.9875030517578}, {\"x\": 487, \"y\": 277.9875030517578}, {\"x\": 474, \"y\": 285.9875030517578}, {\"x\": 469, \"y\": 296.9875030517578}]}]', 1, '2025-09-18 01:07:47'),
(30, 'Rasa', 55, 'Laki-laki', 'Kiri', 'uploads/raw\\30_raw.jpg', 'uploads/mask\\30_masking.jpg', 'uploads/annot\\30_draw_mask.jpg', 0.48, 0.5, 0.25, 'Non Glaucoma', NULL, NULL, NULL, '2025-10-19 04:57:14'),
(31, 'Cara', 44, 'Laki-laki', 'Kanan', 'uploads/raw\\31_raw.jpg', 'uploads/mask\\31_masking.jpg', 'uploads/annot\\31_draw_mask.jpg', 0.88, 0.55, 0.54, 'Glaucoma', NULL, NULL, NULL, '2025-10-19 05:07:12'),
(32, 'dara', 44, 'Perempuan', 'Kanan', 'uploads/raw\\32_raw.jpg', 'uploads/mask\\32_masking.jpg', 'uploads/annot\\32_draw_mask.jpg', 0.88, 0.55, 0.54, 'Glaucoma', NULL, NULL, NULL, '2025-10-19 05:15:17'),
(33, 'Bram', 45, 'Laki-laki', 'Kiri', 'uploads/raw\\33_raw.jpg', 'uploads/mask\\33_masking.jpg', 'uploads/annot\\33_draw_mask.jpg', 0.68, 0.47, 0.31, 'Non Glaucoma', '[{\"id\": \"1760855064280\", \"label\": \"disc\", \"points\": [{\"x\": 457.0098039215686, \"y\": 367.5946691176471}, {\"x\": 461.71568627450984, \"y\": 375.24172794117646}, {\"x\": 474.65686274509807, \"y\": 382.88878676470586}, {\"x\": 492.30392156862746, \"y\": 393.47702205882354}, {\"x\": 513.4803921568628, \"y\": 394.6534926470588}, {\"x\": 524.0686274509803, \"y\": 392.30055147058823}, {\"x\": 541.1274509803922, \"y\": 381.1240808823529}, {\"x\": 552.3039215686274, \"y\": 365.82996323529414}, {\"x\": 555.2450980392157, \"y\": 347.5946691176471}, {\"x\": 556.4215686274509, \"y\": 329.359375}, {\"x\": 555.8333333333333, \"y\": 314.0652573529412}, {\"x\": 547.5980392156863, \"y\": 302.30055147058823}, {\"x\": 539.3627450980392, \"y\": 290.5358455882353}, {\"x\": 521.7156862745098, \"y\": 283.47702205882354}, {\"x\": 505.2450980392157, \"y\": 279.9476102941177}, {\"x\": 491.12745098039215, \"y\": 282.3005514705883}, {\"x\": 475.2450980392157, \"y\": 286.41819852941177}, {\"x\": 467.5980392156863, \"y\": 296.41819852941177}, {\"x\": 463.48039215686276, \"y\": 312.8887867647059}, {\"x\": 458.1862745098039, \"y\": 331.1240808823529}, {\"x\": 456.421568627451, \"y\": 346.41819852941177}]}]', '[{\"id\": \"1760855078807\", \"label\": \"cup\", \"points\": [{\"x\": 474.65686274509807, \"y\": 351.1240808823529}, {\"x\": 478.1862745098039, \"y\": 358.7711397058823}, {\"x\": 485.8333333333333, \"y\": 363.47702205882354}, {\"x\": 495.2450980392157, \"y\": 366.41819852941177}, {\"x\": 508.77450980392155, \"y\": 365.82996323529414}, {\"x\": 519.9509803921569, \"y\": 365.24172794117646}, {\"x\": 529.3627450980392, \"y\": 362.30055147058823}, {\"x\": 535.2450980392157, \"y\": 357.0064338235294}, {\"x\": 539.9509803921568, \"y\": 348.1829044117647}, {\"x\": 539.3627450980392, \"y\": 335.82996323529414}, {\"x\": 538.1862745098039, \"y\": 327.0064338235294}, {\"x\": 531.1274509803922, \"y\": 319.9476102941177}, {\"x\": 522.3039215686274, \"y\": 314.65349264705884}, {\"x\": 508.1862745098039, \"y\": 312.8887867647059}, {\"x\": 492.8921568627451, \"y\": 317.5946691176471}, {\"x\": 484.0686274509804, \"y\": 322.30055147058823}, {\"x\": 477.5980392156863, \"y\": 326.41819852941177}, {\"x\": 471.71568627450984, \"y\": 333.47702205882354}, {\"x\": 472.8921568627451, \"y\": 341.7123161764706}]}]', NULL, '2025-10-19 06:24:14'),
(34, 'Sayang', 44, 'Laki-laki', 'Kanan', 'uploads/raw\\34_raw.png', 'uploads/mask\\34_masking.jpg', 'uploads/annot\\34_draw_mask.jpg', 1.75, 0.78, 0.24, 'Glaucoma', NULL, NULL, NULL, '2025-10-19 06:34:39'),
(35, 'Parah', 56, 'Laki-laki', 'Kanan', 'uploads/raw\\35_raw.jpg', 'uploads/mask\\35_masking.jpg', 'uploads/annot\\35_draw_mask.jpg', 0.35, 0.29, 0.09, 'Non Glaucoma', '[{\"id\": \"1760856528540\", \"label\": \"disc\", \"points\": [{\"x\": 427, \"y\": 369.984375}, {\"x\": 435, \"y\": 392.984375}, {\"x\": 455, \"y\": 400.984375}, {\"x\": 477, \"y\": 401.984375}, {\"x\": 487, \"y\": 391.984375}, {\"x\": 487, \"y\": 366.984375}, {\"x\": 485, \"y\": 343.984375}, {\"x\": 469, \"y\": 345.984375}, {\"x\": 447, \"y\": 344.984375}]}]', '[{\"id\": \"1760856535235\", \"label\": \"cup\", \"points\": [{\"x\": 450, \"y\": 364.984375}, {\"x\": 454, \"y\": 377.984375}, {\"x\": 467, \"y\": 377.984375}, {\"x\": 471, \"y\": 366.984375}, {\"x\": 466, \"y\": 360.984375}]}]', 1, '2025-10-19 06:47:57');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `dr_id_number` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `dr_id_number`, `email`, `username`, `password`, `created_at`) VALUES
(1, 'Dr. Andi Setiawan', 'DR001', 'andi.setiawan@example.com', 'andis', '5d41402abc4b2a76b9719d911017c592', '2025-08-20 05:50:46'),
(2, 'Dr. Budi Santoso', 'DR002', 'budi.santoso@example.com', 'budisant', '5d41402abc4b2a76b9719d911017c592', '2025-08-20 05:50:46'),
(3, 'Dr. Citra Dewi', 'DR003', 'citra.dewi@example.com', 'citradewi', '5d41402abc4b2a76b9719d911017c592', '2025-08-20 05:50:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `predict`
--
ALTER TABLE `predict`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dr_id_number` (`dr_id_number`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `predict`
--
ALTER TABLE `predict`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `predict`
--
ALTER TABLE `predict`
  ADD CONSTRAINT `predict_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
