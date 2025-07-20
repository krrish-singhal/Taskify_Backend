const express = require("express")
const router = express.Router()
const taskController = require("../controller/taskController")
const { protect } = require("../middleware/authMiddleware")

// Apply protect middleware to all routes
router.use(protect)

// Get all tasks with filtering
router.get("/", taskController.getTasks)

// Get task statistics
router.get("/stats", protect, taskController.getTaskStats)

// Get overdue tasks
router.get("/overdue", protect, taskController.getOverdueTasks)

// Create a new task
router.post("/", protect, taskController.createTask)

// Get, update, delete a task
router.get("/:id", protect, taskController.getTask)
router.put("/:id", protect, taskController.updateTask)
router.delete("/:id", protect, taskController.deleteTask)

// Subtasks
router.post("/:id/subtasks", protect, taskController.addSubtask)
router.put("/:id/subtasks/:subtaskId", protect, taskController.updateSubtask)

module.exports = router
