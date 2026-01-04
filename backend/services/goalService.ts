// Goal Service - Uses predictiveForecast to compute goal progress
import Goal, { IGoal } from '../models/Goal'
import { getGoalProgress, type GoalProgress as ForecastGoalProgress } from './predictiveForecast'
import Student from '../models/Student'

export interface GoalWithPrediction extends IGoal {
  prediction?: {
    percentChance: number
    estimatedCompletionDate: Date | null
    onTrack: boolean
    confidence: number
    message: string
  }
}

/**
 * Update goal predictions using predictiveForecast
 */
export async function updateGoalPredictions(goal: IGoal): Promise<GoalWithPrediction> {
  try {
    // Convert goal to forecast format
    const forecastGoals = [{
      id: String(goal._id),
      name: goal.name,
      target: goal.target,
      unit: goal.unit,
      type: goal.type as 'grade' | 'time' | 'completion',
      subject: goal.subject
    }]

    // Get predictions
    const predictions = await getGoalProgress(String(goal.studentId), forecastGoals)
    
    if (predictions.length > 0) {
      const prediction = predictions[0]
      
      // Update goal with prediction data
      const updatedGoal = await Goal.findByIdAndUpdate(
        goal._id,
        {
          estimatedCompletionDate: prediction.predictedCompletion || undefined,
          percentChance: Math.round(prediction.confidence * 100),
          onTrack: prediction.onTrack,
          confidence: prediction.confidence,
          current: prediction.current, // Update current value from forecast
          progressPercentage: prediction.progressPercentage
        },
        { new: true }
      )

      if (!updatedGoal) {
        throw new Error('Failed to update goal')
      }

      return {
        ...updatedGoal.toObject(),
        prediction: {
          percentChance: Math.round(prediction.confidence * 100),
          estimatedCompletionDate: prediction.predictedCompletion,
          onTrack: prediction.onTrack,
          confidence: prediction.confidence,
          message: prediction.forecast.message
        }
      } as unknown as GoalWithPrediction
    }

    return goal.toObject() as unknown as GoalWithPrediction
  } catch (error) {
    console.error('Error updating goal predictions:', error)
    // Return goal without prediction on error
    return goal.toObject() as unknown as GoalWithPrediction
  }
}

/**
 * Get all goals for a student with predictions
 */
export async function getStudentGoalsWithPredictions(studentId: string): Promise<GoalWithPrediction[]> {
  try {
    // Find student by _id or studentId string
    const student = await Student.findOne({ 
      $or: [{ _id: studentId }, { studentId }] 
    })
    if (!student) {
      throw new Error('Student not found')
    }

    // Get all active goals for student
    const goals = await Goal.find({ 
      studentId: String(student._id),
      status: { $in: ['active', 'paused'] }
    }).sort({ createdAt: -1 })

    // Update predictions for each goal
    const goalsWithPredictions = await Promise.all(
      goals.map(goal => updateGoalPredictions(goal))
    )

    return goalsWithPredictions
  } catch (error) {
    console.error('Error getting student goals with predictions:', error)
    return []
  }
}

/**
 * Recalculate goal progress based on current data
 */
export async function recalculateGoalProgress(goalId: string): Promise<GoalWithPrediction | null> {
  const goal = await Goal.findById(goalId)
  if (!goal) {
    return null
  }

  return await updateGoalPredictions(goal)
}

