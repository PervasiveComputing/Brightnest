USE brightnest;

DROP TABLE IF EXISTS 
		actuatorRule,
        sensorRule,
        rule,
        measure,
        sensor,
        actuator ;
        
-- Sensors & Actuators

CREATE TABLE actuator (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        type INTEGER
);
CREATE TABLE sensor (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        type INTEGER,
        isGlobal BOOLEAN
);

CREATE TABLE measure (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        sensorId INTEGER,
        time BIGINT,
        measureType INTEGER,
        value REAL,
        FOREIGN KEY (sensorId) REFERENCES sensor (id)
);

-- Inference Engine

CREATE TABLE rule (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(32),
        UNIQUE(name)
);

CREATE TABLE sensorRule (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        ruleId INTEGER,
        sensorId INTEGER,
        measureType INTEGER NOT NULL,
        intervalStart REAL,
        intervalEnd REAL,
        FOREIGN KEY (ruleId) REFERENCES rule (id),
        FOREIGN KEY (sensorId) REFERENCES sensor (id)
);

CREATE TABLE actuatorRule (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        ruleId INTEGER,
        actuatorId INTEGER,
        value REAL,
        isActive BOOLEAN,
        FOREIGN KEY (ruleId) REFERENCES rule (id),
        FOREIGN KEY (actuatorId) REFERENCES actuator (id)
);

.quit
