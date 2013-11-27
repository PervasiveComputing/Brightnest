DROP TABLE IF EXISTS actuatorRule;
DROP TABLE IF EXISTS sensorRule;
DROP TABLE IF EXISTS rule;
DROP TABLE IF EXISTS measure;
DROP TABLE IF EXISTS sensor;
DROP TABLE IF EXISTS actuator;
        
-- Sensors & Actuators

CREATE TABLE actuator (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type INTEGER
);
CREATE TABLE sensor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type INTEGER,
        isGlobal BOOLEAN
);

CREATE TABLE measure (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensorId INTEGER,
        time BIGINT,
        measureType INTEGER,
        value REAL,
        FOREIGN KEY (sensorId) REFERENCES sensor (id)
);

-- Inference Engine

CREATE TABLE rule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(32),
        UNIQUE(name)
);

CREATE TABLE sensorRule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruleId INTEGER,
        sensorId INTEGER,
        measureType INTEGER NOT NULL,
        intervalStart REAL,
        intervalEnd REAL,
        FOREIGN KEY (ruleId) REFERENCES rule (id),
        FOREIGN KEY (sensorId) REFERENCES sensor (id)
);

CREATE TABLE actuatorRule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruleId INTEGER,
        actuatorId INTEGER,
        value REAL,
        isActive BOOLEAN,
        FOREIGN KEY (ruleId) REFERENCES rule (id),
        FOREIGN KEY (actuatorId) REFERENCES actuator (id)
);

.quit
