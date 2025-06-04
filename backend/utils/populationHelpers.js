/**
 * Optimized population helpers to prevent complex nested queries and improve performance
 */

// Standard population configurations for consistent use across controllers
const populationConfigs = {
  // Student populations
  student: {
    basic: [
      { path: 'department', select: 'name code' },
      { path: 'course', select: 'name code' },
      { path: 'batch', select: 'name academicYear section timing' }
    ],
    detailed: [
      { path: 'department', select: 'name code description' },
      { path: 'course', select: 'name code description duration fees' },
      { 
        path: 'batch', 
        select: 'name academicYear section timing startDate endDate maxStudents',
        populate: {
          path: 'createdBy',
          select: 'name email role'
        }
      }
    ],
    minimal: [
      { path: 'department', select: 'name' },
      { path: 'course', select: 'name' },
      { path: 'batch', select: 'name' }
    ]
  },

  // Batch populations
  batch: {
    basic: [
      { path: 'course', select: 'name code department' },
      { path: 'createdBy', select: 'name email role' }
    ],
    detailed: [
      { 
        path: 'course', 
        select: 'name code description department duration fees',
        populate: {
          path: 'department',
          select: 'name code'
        }
      },
      { path: 'createdBy', select: 'name email role department' }
    ],
    withStudentCount: [
      { path: 'course', select: 'name code' },
      { path: 'createdBy', select: 'name email' },
      { path: 'studentCount' }
    ]
  },

  // Course populations
  course: {
    basic: [
      { path: 'department', select: 'name code' },
      { path: 'createdBy', select: 'name email' }
    ],
    detailed: [
      { path: 'department', select: 'name code description' },
      { path: 'createdBy', select: 'name email role' },
      { path: 'batchCount' }
    ]
  },

  // Department populations
  department: {
    basic: [
      { path: 'headOfDepartment', select: 'name email' }
    ],
    detailed: [
      { path: 'headOfDepartment', select: 'name email role phone' },
      { path: 'courseCount' }
    ]
  },

  // Attendance populations
  attendance: {
    basic: [
      { path: 'student', select: 'name rollNo email' },
      { path: 'batch', select: 'name academicYear section' },
      { path: 'markedBy', select: 'name email' }
    ],
    detailed: [
      { 
        path: 'student', 
        select: 'name rollNo email phone',
        populate: {
          path: 'course',
          select: 'name code'
        }
      },
      { path: 'batch', select: 'name academicYear section timing' },
      { path: 'markedBy', select: 'name email role' }
    ]
  },

  // Booking populations
  booking: {
    basic: [
      { path: 'pc', select: 'pcNumber row position status' },
      { path: 'student', select: 'name rollNo' },
      { path: 'batch', select: 'name academicYear section' },
      { path: 'bookedBy', select: 'name email' }
    ],
    detailed: [
      { path: 'pc', select: 'pcNumber row position status specifications' },
      { 
        path: 'student', 
        select: 'name rollNo email phone',
        populate: {
          path: 'course',
          select: 'name code'
        }
      },
      { path: 'batch', select: 'name academicYear section timing' },
      { path: 'bookedBy', select: 'name email role' }
    ]
  }
};

/**
 * Apply population to a query based on model and type
 * @param {Object} query - Mongoose query object
 * @param {string} model - Model name (student, batch, course, etc.)
 * @param {string} type - Population type (basic, detailed, minimal)
 * @returns {Object} Query with population applied
 */
function applyPopulation(query, model, type = 'basic') {
  const config = populationConfigs[model]?.[type];
  if (!config) {
    console.warn(`Population config not found for ${model}.${type}`);
    return query;
  }

  return query.populate(config);
}

/**
 * Get population configuration for a specific model and type
 * @param {string} model - Model name
 * @param {string} type - Population type
 * @returns {Array} Population configuration array
 */
function getPopulationConfig(model, type = 'basic') {
  return populationConfigs[model]?.[type] || [];
}

/**
 * Apply selective population based on user role and requirements
 * @param {Object} query - Mongoose query object
 * @param {string} model - Model name
 * @param {Object} options - Options object
 * @param {string} options.userRole - User role (admin, teacher)
 * @param {boolean} options.includeStats - Whether to include statistical data
 * @param {boolean} options.minimal - Whether to use minimal population
 * @returns {Object} Query with appropriate population
 */
function applyRoleBasedPopulation(query, model, options = {}) {
  const { userRole, includeStats, minimal } = options;

  let populationType = 'basic';

  if (minimal) {
    populationType = 'minimal';
  } else if (userRole === 'admin' || includeStats) {
    populationType = 'detailed';
  }

  return applyPopulation(query, model, populationType);
}

/**
 * Optimize query for large datasets
 * @param {Object} query - Mongoose query object
 * @param {Object} options - Optimization options
 * @param {number} options.limit - Limit for results
 * @param {boolean} options.lean - Whether to use lean queries
 * @param {string} options.select - Fields to select
 * @returns {Object} Optimized query
 */
function optimizeQuery(query, options = {}) {
  const { limit = 100, lean = false, select } = options;

  if (lean) {
    query = query.lean();
  }

  if (select) {
    query = query.select(select);
  }

  if (limit && limit < 1000) {
    query = query.limit(limit);
  }

  return query;
}

/**
 * Create aggregation pipeline for complex queries with population
 * @param {string} model - Model name
 * @param {Object} matchStage - Match stage for aggregation
 * @param {Object} options - Additional options
 * @returns {Array} Aggregation pipeline
 */
function createAggregationPipeline(model, matchStage = {}, options = {}) {
  const { includeStats = false, sortBy = 'createdAt', sortOrder = -1 } = options;

  const pipeline = [
    { $match: matchStage },
    { $sort: { [sortBy]: sortOrder } }
  ];

  // Add lookup stages based on model
  if (model === 'student') {
    pipeline.push(
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department',
          pipeline: [{ $project: { name: 1, code: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
          pipeline: [{ $project: { name: 1, code: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'batch',
          foreignField: '_id',
          as: 'batch',
          pipeline: [{ $project: { name: 1, academicYear: 1, section: 1 } }]
        }
      }
    );

    // Unwind arrays to objects
    pipeline.push(
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } }
    );
  }

  if (includeStats && model === 'student') {
    pipeline.push({
      $lookup: {
        from: 'attendances',
        localField: '_id',
        foreignField: 'student',
        as: 'attendanceRecords'
      }
    });

    pipeline.push({
      $addFields: {
        attendanceStats: {
          total: { $size: '$attendanceRecords' },
          present: {
            $size: {
              $filter: {
                input: '$attendanceRecords',
                cond: { $eq: ['$$this.status', 'present'] }
              }
            }
          }
        }
      }
    });

    pipeline.push({
      $project: { attendanceRecords: 0 }
    });
  }

  return pipeline;
}

module.exports = {
  populationConfigs,
  applyPopulation,
  getPopulationConfig,
  applyRoleBasedPopulation,
  optimizeQuery,
  createAggregationPipeline
};
