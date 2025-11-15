CREATE TYPE quest_state AS ENUM ('pending', 'verified', 'denied');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    points integer DEFAULT 0 NOT NULL
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(250) NOT NULL,
    points_received integer NOT NULL,
    required_points integer NOT NULL
);

CREATE TABLE user_quest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    quest_id UUID NOT NULL,
    user_id UUID NOT NULL,
    progress quest_state,
    proof_path VARCHAR(255),


    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quest_id) REFERENCES quests(id)
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(50),
    point_receive integer
);


CREATE TABLE quesiton_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL,
    answer VARCHAR(50),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

INSERT INTO users (id, name, mail, password_hash, is_admin, points) VALUES(gen_random_uuid(), 'admin', 'admin@example.com', '0', true, 10);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('Заземяване „Ресет“', '3-минутно заземяване: бавно дишане + назови 5 неща, които виждаш около себе си. Минимално усилие, подходящо при ниска енергия.', 9, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('Емоционален „Синхрон“', 'Напиши кратък журнал от 2–3 изречения: „Как се чувствам в момента и какво може да е причината?“ Лека саморефлексия.', 18, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Слънчев заряд“', 'Излез за 1–2 минути на естествена светлина и направи снимка. Леко движение + контакт със слънчева светлина.', 27, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Хранене без телефон“', 'Изяж едно хранене или изпий напитка без да докосваш телефона. Управление на навик, но лесно изпълнимо.', 36, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„30-минутен дигитален детокс“', '30 минути по таймер без телефон и социални мрежи. Изисква дисциплина, но времето е кратко.', 45, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Спокойната стъпка“', 'Бавна mindful разходка за 2–4 минути — направи снимка на нещо, което ти е направило впечатление. Комбинация от движение + внимание към настоящето.', 54, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Мини организация“', 'Отдели 5 минути да подредиш малка зона: бюро, рафт, чанта или само едно чекмедже. Малко физическо усилие, но с видим резултат.', 63, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Природна контролна точка“', 'Излез на кратка разходка в по-природна среда и направи снимка на дърво, небе или пейзаж. Изисква повече време и напускане на дома.', 72, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Балон на фокуса“', '10–15 минути дълбока работа без разсейване — снимай резултата (бележки, код, подредено място). Силен контрол на вниманието + самодисциплина.', 81, 9);

INSERT INTO quests (name, description, required_points, points_received) VALUES
('„Капка доброта“', 'Извърши малък акт на добрина: съобщение за благодарност, извинение, подкрепящо послание или комплимент. Емоционално най-изискващо — изисква смелост и емпатия.', 90, 9);
