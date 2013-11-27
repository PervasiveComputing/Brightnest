DROP TABLE IF EXISTS actuatorRule;
DROP TABLE IF EXISTS sensorRule;
DROP TABLE IF EXISTS rule;
DROP TABLE IF EXISTS measure;
DROP TABLE IF EXISTS sensor;
DROP TABLE IF EXISTS actuator;
        
-- Sensors & Actuators

CREATE TABLE Actuators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type VARCHAR(32)
);
CREATE TABLE sensor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type VARCHAR(32)
);

CREATE TABLE Measures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensorId INTEGER,
        time DATETIME,
        measureType INTEGER,
        value REAL,
        FOREIGN KEY (sensorId) REFERENCES sensor (id)
);

-- Inference Engine

CREATE TABLE Rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(32),
        UNIQUE(name)
);

CREATE TABLE SensorRules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruleId INTEGER,
        sensorId INTEGER,
        measureType INTEGER NOT NULL,
        intervalStart REAL,
        intervalEnd REAL,
        FOREIGN KEY (ruleId) REFERENCES rule (id),
        FOREIGN KEY (sensorId) REFERENCES sensor (id)
);

CREATE TABLE ActuatorRules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruleId INTEGER,
        actuatorId INTEGER,
        value REAL,
        isActive BOOLEAN,
        FOREIGN KEY (ruleId) REFERENCES rule (id),
        FOREIGN KEY (actuatorId) REFERENCES actuator (id)
);

.quit
