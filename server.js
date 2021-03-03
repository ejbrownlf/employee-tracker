const inquirer = require('inquirer');
const connection = require('./connection');

let departments = []
let employees = [];
let employeesNoManagers = [];
let roles = [];
let managers = [];

//creates and updates departments list
function getDepartments() {
    departments = []
    connection.query('select name from department', (err ,result) => {
        if (err) throw err;
        result.forEach((department) => {
            departments.push(department.name)
        });
    }
)}

//creates and updates role list
function getRoles() {
    roles = [];
    connection.query('select title from role', (err ,result) => {
        if (err) throw err;
        result.forEach((role) => {
            roles.push(role.title)
        });
    }
)};

//creats and updates employee list
function getEmployees() {
    employees = [];
    connection.query('select concat(first_name, " ", last_name) AS name FROM employee', (err ,result) => {
        if (err) throw err;
        result.forEach((employee) => {
           employees.push(employee.name)
        });
    }
)};

//creates and updates manager list
function getManagers() {
    managers = [];
    connection.query('select * FROM employee', (err ,result) => {
        if (err) throw err;
        result.forEach((employee) => {
           if (employee.manager_id === null) {
               let managerName = employee.first_name + ' ' + employee.last_name;
               managers.push(managerName);
           }
        });
    }
)};

//creates and updates list of employees that are not managers
function getEmployeesNoManagers() {
    employeesNoManagers = [];
    connection.query('select concat(first_name, " ", last_name) AS name, manager_id FROM employee', (err ,result) => {
        if (err) throw err;
        result.forEach((employee) => {
           if (employee.manager_id !== null) {
               employeesNoManagers.push(employee.name)
            }
        });
    }
)};

function start() {
    inquirer
        .prompt([
            {
                type: 'list',
                message: 'What would you like to do?',
                choices: ['View All Employees', 'View all departments', 'Add employee', 'Remove Employee', 'Update employee role', 'Update employee manager', 'View all roles', 'View employees by manager', 'Add Department', 'Add role', 'Remove department', 'Remove role', 'View total utilized budeget of a department', 'None'],
                name: 'action',
            }
        ]).then(res => {
            

            //VIEW FUNCTIONS
            //view all employee information
            if (res.action === 'View All Employees'){
                let query = 'Select employee.id,  employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, employee.manager_id AS manager ';
                query += 'FROM employee ';
                query += 'INNER JOIN role ON (role.id = employee.role_id) ';
                query += 'INNER JOIN department ON (role.department_id = department.id) ';
                query += 'ORDER BY employee.id';
                
                connection.query(query, (err, result) => {
                    result.forEach(member => {
                        if (member.manager !== null) {
                            member.manager = result[member.manager - 1].first_name + ' ' + result[member.manager - 1].last_name;
                        }
                    })
                    if (err) throw err;
                    console.log(`\n`)
                    console.table(result);
                    start();
                })
            }
            //view all company departments
            else if (res.action === 'View all departments'){
                let query = 'SELECT name AS department from department';
                connection.query(query, (err, result) => {
                    if (err) throw err;
                    console.log(`\n`)
                    console.table(result);
                    start();
                })
            }
            //view employee by their respective manager
            else if (res.action === 'View employees by manager'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Under which manager would you like to view employees?',
                        choices: managers,
                        name: 'viewByManager'
                    }
                ]).then(res => {
                     let query = 'SELECT id, first_name, last_name, manager_id FROM employee ORDER BY manager_id'
                     connection.query(query, (err, result) => {
                         if (err) throw err;

                         const managerName = res.viewByManager.split(' ');
                         let managerID = 0;
                         const team = [];
                     
                         result.forEach(member => {
                             if (member.first_name === managerName[0] && member.last_name === managerName[1]) {
                                 managerID = member.id;
                                 team.push(member);
                             }else if (member.manager_id === managerID) {
                                 team.push(member);
                             }
                         });

                         console.log(`\n`);
                         console.table(team);
                         start();
                     })
                })
            }
            //view total budget of a selected department
            else if (res.action === 'View total utilized budeget of a department'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Choose which department you would like to view the  budeget information for',
                        choices: departments,
                        name: 'departments'
                    }
                ]).then((res) => {
                    let query = 'select role.salary from role INNER JOIN department ON (role.department_id = department.id) where department.name = ?';

                    connection.query(query, [res.departments], (err, result) => {
                        if (err) throw err;
                        let salary = 0

                        result.forEach(budget => {
                            salary += budget.salary
                        });

                        console.table(`\n The total budget for ${res.departments} is $${salary} \n`);

                        start();
                    })
                })
            }
            //view all roles within company
            else if (res.action === 'View all roles'){
                let query = 'SELECT title, salary FROM role'
                connection.query(query, (err, result) => {
                    if (err) throw err;

                    console.log(`\n`);
                    console.table(result);

                    start();
                })
            }



            //ADD FUNCTIONS
            // add employee
            else if (res.action === 'Add employee'){
               inquirer.prompt([
                {
                    type: 'input',
                    message: 'What is the first name of this employee:',
                    name: 'firstName'
                },
                {
                    type: 'input',
                    message: 'What is the last name of this employee:',
                    name: 'lastName'
                },
                {
                    type: 'list',
                    message: 'Which role will this employee have?',
                    choices: roles,
                    name: 'roles'
                }
               ]).then(res => {
                    const isManager = res.roles.split(' ')

                    let query = "SELECT * FROM role WHERE title = ?"

                    connection.query(query, [res.roles], (err, roleRes) => {
                        if (err) throw err;

                        const roleID = roleRes[0].id

                        if (!isManager.includes('Manager') && !isManager.includes('Lead')){
                        inquirer.prompt([
                            {
                                type: 'list',
                                message: 'Which Manager is this new employee working under?',
                                choices: managers,
                                name: 'manager'
                            }
                        ]).then(newRes => {
                            let query = "Select id from employee where concat(first_name, ' ', last_name) = ?"
                            connection.query(query, [newRes.manager], (err, result) => {
                                if (err) throw err;

                                let managerID = result[0].id;
                                let query = "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)"

                                connection.query(query,[res.firstName, res.lastName, roleID, managerID], (err, newResult) => {
                                    if (err) throw err;

                                    console.log(`\n Created new employee: ${res.firstName} ${res.lastName}
                                    Role: ${res.roles}
                                    Manager: ${newRes.manager} \n`);

                                    getEmployees();
                                    getEmployeesNoManagers()
                                    start();
                                })
                            })
                        })
                        }else {
                            let query = "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?,?,?)"

                            connection.query(query, [res.firstName, res.lastName, roleID, NULL], (err, result) => {
                                if (err) throw err;

                                console.log(`\n Created new Manager: ${res.firstName} ${res.lastName}
                                    Role: ${res.roles} \n `);

                                getEmployees();
                                getManagers();
                                start();
                            })
                        }
                    })
               })
            }
            // add department
            else if (res.action === 'Add Department'){
                inquirer.prompt([
                    {
                        type: 'input',
                        message: 'Input the department you would like to add',
                        name: 'newDepartment'
                    }
                ]).then(res => {
                     let query = 'INSERT INTO department (name) VALUES (?)'
                     connection.query(query, [res.newDepartment], (err, result) => {
                         if (err) throw err;
                         console.log(`\n Added new department: ${res.newDepartment} \n`)
                         getDepartments();
                         start();
                     })
                })
            }
            //add role
            else if (res.action === 'Add role'){
                inquirer.prompt([
                    {
                        type: 'input',
                        message: 'Input the new role you would like to add (if this is a manger role include the word Manager or Lead):',
                        name: 'newRole'
                    },
                    {
                        type: 'input',
                        message: 'What is the salary of this new role?',
                        name: 'newSalary'
                    },
                    {
                        type: 'list',
                        message: 'Under which department is this role under?',
                        choices: departments,
                        name: 'departments'
                    }
                ]).then(res => {
                     let query = "Select * from department WHERE name = ?"
                     connection.query(query, [res.departments], (err, result) => {
                         if (err) throw err;
                         let departmentID = result[0].id;
                         

                         query = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';

                         connection.query(query, [res.newRole, res.newSalary, departmentID], (err, result) => {
                            if (err) throw err;
                            
                            console.log(`\n Created new role title: ${res.newROle}, salary: ${res.newSalary}, and under department: ${res.departments} \n`)

                            getRoles();
                            start();
                        })
                     })
                })
            }



            //REMOVE FUNCTIONS
            //remove employee
            else if (res.action === 'Remove Employee'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Which Employee would you like to remove?',
                        choices: employees,
                        name: 'removeEmployee'
                    }
                ]).then(res => {
                     let query = 'DELETE FROM employee WHERE concat(first_name, " ", last_name) = ?'
                     connection.query(query, [res.removeEmployee], (err, result) => {
                         if (err) throw err;
                         console.log(`\n Removed Employee: ${res.removeEmployee} \n`)
                         getEmployees();
                         getEmployeesNoManagers();
                         getManagers();
                         start();
                     })
                })
            }
            //remove department
            else if (res.action === 'Remove department'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Which Department would you like to remove?',
                        choices: departments,
                        name: 'removeDepartment'
                    }
                ]).then(res => {
                     let query = 'select * FROM department WHERE name = ?'
                     connection.query(query, [res.removeDepartment], (err, result) => {
                        if (err) throw err;

                        const departmentID = result[0].id;

                        query = "DELETE FROM department WHERE id = ?; DELETE from role WHERE department_id = ?"

                        connection.query(query, [departmentID, departmentID], (err, result) => {
                            if (err) throw err;

                            console.log(`\n Removed Department: ${res.removeDepartment} and all associated role \n MAKE SURE YOU UPDATE YOUR EMPLOYEES OR REMOVE THEM! \n`)
                            getDepartments();
                            getRoles();
                            start();
                        })
                     })
                })
            }
            //remove role
            else  if (res.action === 'Remove role'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Which Role would you like to remove?',
                        choices: roles,
                        name: 'removeRole'
                    }
                ]).then(res => {
                     let query = 'DELETE FROM role WHERE title = ?'
                     connection.query(query, [res.removeRole], (err, result) => {
                         if (err) throw err;
                         console.log(`\n Removed Role: ${res.removeRole}  \n MAKE SURE YOU UPDATE YOUR EMPLOYEES AND OR REMOVE FROM YOUR DATABASE \n`)
                         getRoles();
                         start();
                     })
                })
            }




            //UPDATE FUNCTIONS
            //update employee manager
            else if (res.action === 'Update employee manager'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Which employee would you like to update their manager?',
                        choices: employeesNoManagers,
                        name: 'updatedEmployeeManager'
                    },
                    {
                        type: 'list',
                        message: 'Which manager would you like to assign this employee to',
                        choices: managers,
                        name: 'updatedManager'
                    }
                ]).then(res => {
                    let query = "Select id from employee where concat(first_name, ' ', last_name) = ?"

                    connection.query(query, [res.updatedManager], (err, result) => {
                        if (err) throw err;

                        let managerID = result[0].id;

                        let query = "UPDATE employee SET manager_id = ? WHERE concat(first_name, ' ', last_name) = ?"

                        connection.query(query, [managerID, res.updatedEmployeeManager], (err, newResult) => {
                            if (err) throw err;

                            console.log(`\n Updated ${res.updatedEmployeeManager}'s manager to ${res.updatedManager} \n`)
                            
                            getEmployees();
                            getEmployeesNoManagers();
                            getManagers();
                            start();
                        })
                    })
                })
            }
            else if (res.action === 'Update employee role'){
                inquirer.prompt([
                    {
                        type: 'list',
                        message: 'Which employee would you like to update their role?',
                        choices: employees,
                        name: 'updatedEmployeeRole'
                    },
                    {
                        type: 'list',
                        message: 'Which role would you like to change them to?',
                        choices: roles,
                        name: 'updatedRole'
                    },
                ]).then(res => {
                    let query = "Select id, title from role where title = ?"

                    connection.query(query, [res.updatedRole], (err, result) => {
                        if (err) throw err;

                        const roleTitle = result[0].title.split(' ')
                        const roleID = result[0].id;

                        let query = "UPDATE employee SET role_id = ?, manager_id = 1 WHERE concat(first_name, ' ', last_name) = ?"

                        if(roleTitle.includes('Lead') || roleTitle.includes('Manager')) {
                            query = "UPDATE employee SET role_id = ?, manager_id = NULL WHERE concat(first_name, ' ', last_name) = ?"
                        }

                        connection.query(query, [roleID, res.updatedEmployeeRole], (err, newResult) => {
                            if (err) throw err;

                            console.log(`\n Updated ${res.updatedEmployeeRole}'s role to ${res.updatedRole} \n`)
                            
                            getEmployees();
                            getEmployeesNoManagers();
                            getManagers();
                            start();
                        })
                    })
                })
            }

            //END PROCESS
            else if (res.action === 'None'){
                process.exit();
            }
        })
};

getDepartments();
getRoles();
getEmployees();
getManagers();
getEmployeesNoManagers();
start();
