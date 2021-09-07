const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const addDays = require("date-fns/addDays");
const isValid = require("date-fns/isValid");

const app = express();
const dbPath = path.join(__dirname, "todoApplication.db");

let database = null;

app.use(express.json());

const initializingDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error message:${e.message}`);
    process.exit(1);
  }
};

initializingDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const statusCheck = (status) => {
  return status === ("TO DO" || "IN PROGRESS" || "DONE");
};

const priorityCheck = (priority) => {
  return priority === ("HIGH" || "MEDIUM" || "LOW");
};

const categoryCheck = (category) => {
  return category === ("WORK" || "HOME" || "LEARNING");
};

const authentication = (request, response, next) => {
  const { search_q, priority, status, category } = request.params;

  /* switch (false) {
    case statusCheck(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case priorityCheck(status):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case categoryCheck(status):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    default:
      next();
  }*/
};

//GET TODOS

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (statusCheck(status)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE status = '${status}'
            AND todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasPriorityProperty(request.query):
      if (priorityCheck(priority)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE priority = '${priority}'
            AND todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (categoryCheck(category)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE category = '${category}'
            AND todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityAndStatusProperties(request.query):
      if (priorityCheck(priority) && statusCheck(status)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE priority = '${priority}'
            AND status = '${status}'
            AND todo = '%${search_q}%';`;
      } else {
        if (priorityCheck(priority)) {
          response.status(400);
          response.send("Invalid Todo Status");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (categoryCheck(category) && statusCheck(status)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE category = '${category}'
            AND status ='${status}'
            AND todo LIKE '%${search_q}%';`;
      } else {
        if (categoryCheck(category) === true) {
          response.status(400);
          response.send("Invalid Todo Status");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (categoryCheck(category) && priorityCheck(priority)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE priority = '${priority}'
            AND category = '${category}'
            AND todo LIKE '%${search_q}%';`;
      } else {
        if (categoryCheck(category) === true) {
          response.status(400);
          response.send("Invalid Todo Priority");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    default:
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(
    data.map((eachtodo) => convertDBObjectToResponseObject(eachtodo))
  );
});

//GET A TODO BASED ON TODOID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertDBObjectToResponseObject(todo));
});

//GET TODOS WITH DUEDATE
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getTodosBasedOnDueDateQuery = `
    SELECT *
    FROM todo
    WHERE due_date = "${date}";`;
  const todosList = await database.all(getTodosBasedOnDueDateQuery);
  response.send(
    todosList.map((eachtodo) => convertDBObjectToResponseObject(eachtodo))
  );
});

//CREATE A TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  /*switch (false) {
    case statusCheck(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case priorityCheck(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case categoryCheck(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    default:*/
  const postTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status , category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}','${dueDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
  //}
});

//UPDATE TODO

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  try {
    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;

    const updateTodoQuery = `
        UPDATE
        todo
        SET
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category = '${category}',
        due_date = '${dueDate}'
        WHERE
        id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } catch (error) {
    console.log(`${error.message}`);
  }
});

//DELETE A TODO

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
