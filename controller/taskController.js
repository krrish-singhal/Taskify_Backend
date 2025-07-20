const Task = require("../models/Task")
const mongoose = require("mongoose")

// Helper function to check if a string is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// Get all tasks with optional filtering
exports.getTasks = async (req, res) => {
  try {
    const { completed, priority, dueDate, search, tags } = req.query

    // Build filter object
    const filter = { user: req.user._id } // Only return tasks for the current user

    // Handle completed filter
    if (completed !== undefined) {
      filter.completed = completed === "true"
    }

    // Handle priority filter
    if (priority) {
      filter.priority = priority
    }

    // Handle tags filter
    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] }
    }

    // Handle search
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Handle due date filter
    if (dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      if (dueDate === "today") {
        filter.dueDate = {
          $gte: today,
          $lt: tomorrow,
        }
      } else if (dueDate === "tomorrow") {
        filter.dueDate = {
          $gte: tomorrow,
          $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        }
      } else if (dueDate === "upcoming") {
        filter.dueDate = {
          $gte: today,
        }
        filter.completed = false
      } else if (dueDate === "overdue") {
        filter.dueDate = {
          $lt: today,
        }
        filter.completed = false
      }
    }

    // Execute query
    const tasks = await Task.find(filter).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    })
  } catch (error) {
    console.error("Error getting tasks:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get total tasks count
    const total = await Task.countDocuments({ user: req.user._id })

    // Get completed tasks count
    const completed = await Task.countDocuments({
      user: req.user._id,
      completed: true,
    })

    // Get tasks due today
    const dueToday = await Task.countDocuments({
      user: req.user._id,
      dueDate: {
        $gte: today,
        $lt: tomorrow,
      },
      completed: false,
    })

    // Get overdue tasks
    const overdue = await Task.countDocuments({
      user: req.user._id,
      dueDate: { $lt: today },
      completed: false,
    })

    // Get important tasks
    const important = await Task.countDocuments({
      user: req.user._id,
      tags: "important",
      completed: false,
    })

    res.status(200).json({
      success: true,
      stats: {
        total,
        completed,
        dueToday,
        overdue,
        important,
      },
    })
  } catch (error) {
    console.error("Error getting task stats:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Get a single task
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      })
    }

    const task = await Task.findById(id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this task",
      })
    }

    res.status(200).json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Error getting task:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, tags } = req.body

    // Create task
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      tags,
      user: req.user._id,
      completed: false,
    })

    res.status(201).json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Error creating task:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      })
    }

    let task = await Task.findById(id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this task",
      })
    }

    // If task is being marked as completed, set completedAt
    if (!task.completed && req.body.completed === true) {
      req.body.completedAt = new Date()
    }

    // If task is being marked as not completed, remove completedAt
    if (task.completed && req.body.completed === false) {
      req.body.completedAt = null
    }

    // Update task
    task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Error updating task:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this task",
      });
    }

    // ✅ Use findByIdAndDelete instead of task.remove()
    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Add subtask
exports.addSubtask = async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      })
    }

    const task = await Task.findById(id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this task",
      })
    }

    // Add subtask
    task.subtasks.push({
      title,
      completed: false,
    })

    await task.save()

    res.status(200).json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Error adding subtask:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Update subtask
exports.updateSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params
    const { completed } = req.body

    // Validate ObjectIds
    if (!isValidObjectId(id) || !isValidObjectId(subtaskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      })
    }

    const task = await Task.findById(id)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if task belongs to user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this task",
      })
    }

    // Find subtask
    const subtask = task.subtasks.id(subtaskId)

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: "Subtask not found",
      })
    }

    // Update subtask
    subtask.completed = completed

    await task.save()

    res.status(200).json({
      success: true,
      task,
    })
  } catch (error) {
    console.error("Error updating subtask:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Get overdue tasks
exports.getOverdueTasks = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tasks = await Task.find({
      user: req.user._id,
      dueDate: { $lt: today },
      completed: false,
    }).sort({ dueDate: 1 })

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    })
  } catch (error) {
    console.error("Error getting overdue tasks:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}
