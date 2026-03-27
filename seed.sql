CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary NUMERIC(10,2) NOT NULL,
  hired_at DATE NOT NULL
);

CREATE TABLE absences (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT
);

INSERT INTO departments (name) VALUES
('Engineering'),
('Marketing'),
('HR'),
('Sales');

INSERT INTO employees (name, email, department_id, salary, hired_at) VALUES
('Juan Pérez', 'juan@empresa.com', 1, 3200, '2022-03-15'),
('Laura Gómez', 'laura@empresa.com', 2, 2800, '2023-01-10'),
('Carlos Ruiz', 'carlos@empresa.com', 1, 4000, '2021-07-22'),
('Ana Torres', 'ana@empresa.com', 3, 2600, '2023-05-01'),
('Miguel Sánchez', 'miguel@empresa.com', 4, 3000, '2022-11-11'),
('Lucía Fernández', 'lucia@empresa.com', 2, 2900, '2021-09-30'),
('David Martín', 'david@empresa.com', 1, 3500, '2020-06-18'),
('Sofía López', 'sofia@empresa.com', 3, 2700, '2022-08-05'),
('Pablo Díaz', 'pablo@empresa.com', 4, 3100, '2023-02-14'),
('Elena Navarro', 'elena@empresa.com', 1, 3800, '2021-12-01');

INSERT INTO absences (employee_id, start_date, end_date, reason) VALUES
(1, '2024-01-10', '2024-01-15', 'Vacaciones'),
(2, '2024-02-01', '2024-02-03', 'Enfermedad'),
(3, '2024-03-05', '2024-03-10', 'Vacaciones'),
(5, '2024-01-20', '2024-01-22', 'Asuntos personales'),
(7, '2024-02-15', '2024-02-20', 'Vacaciones'),
(4, '2024-03-01', '2024-03-02', 'Enfermedad');