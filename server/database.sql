CREATE DATABASE IF NOT EXISTS cam_real_estate;
USE cam_real_estate;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    otp_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS apartments;
CREATE TABLE apartments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    detailed_description TEXT,
    neighborhood_info TEXT,
    price DECIMAL(15, 2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 0,
    area_sqft INT DEFAULT 0,
    property_type VARCHAR(100) DEFAULT 'Apartment',
    status ENUM('For Sale', 'For Rent') DEFAULT 'For Sale',
    availability_status ENUM('Available', 'Sold') DEFAULT 'Available',
    complex_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS apartment_images;
CREATE TABLE apartment_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
);
