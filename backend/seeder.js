const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/userModel');
const Batch = require('./models/batchModel');
const Student = require('./models/studentModel');
const PC = require('./models/pcModel');
const LabBooking = require('./models/labBookingModel');
const Attendance = require('./models/attendanceModel');

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@caddcentre.com',
    password: 'Admin@123456',
    role: 'admin'
  },
  {
    name: 'John Teacher',
    email: 'john@caddcentre.com',
    password: 'Teacher@123456',
    role: 'teacher'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@caddcentre.com',
    password: 'Teacher@123456',
    role: 'teacher'
  }
];

const batches = [
  {
    name: 'AutoCAD Mechanical',
    academicYear: '2024-25',
    section: 'A',
    timing: '09:00-10:30'
  },
  {
    name: 'Web Development',
    academicYear: '2024-25',
    section: 'B',
    timing: '10:30-12:00'
  },
  {
    name: 'Data Science',
    academicYear: '2024-25',
    section: 'A',
    timing: '12:00-13:30'
  },
  {
    name: 'Digital Marketing',
    academicYear: '2024-25',
    section: 'C',
    timing: '14:00-15:30'
  },
  {
    name: 'Mobile App Development',
    academicYear: '2024-25',
    section: 'B',
    timing: '15:30-17:00'
  }
];

const students = [
  // AutoCAD Mechanical batch students
  { name: 'Alice Johnson', rollNo: 'AM001', email: 'alice@example.com', phone: '9876543210' },
  { name: 'Bob Smith', rollNo: 'AM002', email: 'bob@example.com', phone: '9876543211' },
  { name: 'Charlie Brown', rollNo: 'AM003', email: 'charlie@example.com', phone: '9876543212' },
  { name: 'Diana Prince', rollNo: 'AM004', email: 'diana@example.com', phone: '9876543213' },
  { name: 'Edward Norton', rollNo: 'AM005', email: 'edward@example.com', phone: '9876543214' },

  // Web Development batch students
  { name: 'Frank Miller', rollNo: 'WD001', email: 'frank@example.com', phone: '9876543215' },
  { name: 'Grace Kelly', rollNo: 'WD002', email: 'grace@example.com', phone: '9876543216' },
  { name: 'Henry Ford', rollNo: 'WD003', email: 'henry@example.com', phone: '9876543217' },
  { name: 'Ivy League', rollNo: 'WD004', email: 'ivy@example.com', phone: '9876543218' },
  { name: 'Jack Ryan', rollNo: 'WD005', email: 'jack@example.com', phone: '9876543219' },

  // Data Science batch students
  { name: 'Kate Winslet', rollNo: 'DS001', email: 'kate@example.com', phone: '9876543220' },
  { name: 'Leo DiCaprio', rollNo: 'DS002', email: 'leo@example.com', phone: '9876543221' },
  { name: 'Morgan Freeman', rollNo: 'DS003', email: 'morgan@example.com', phone: '9876543222' },
  { name: 'Nicole Kidman', rollNo: 'DS004', email: 'nicole@example.com', phone: '9876543223' },
  { name: 'Oscar Isaac', rollNo: 'DS005', email: 'oscar@example.com', phone: '9876543224' },

  // Digital Marketing batch students
  { name: 'Paul Walker', rollNo: 'DM001', email: 'paul@example.com', phone: '9876543225' },
  { name: 'Quinn Fabray', rollNo: 'DM002', email: 'quinn@example.com', phone: '9876543226' },
  { name: 'Rachel Green', rollNo: 'DM003', email: 'rachel@example.com', phone: '9876543227' },
  { name: 'Steve Rogers', rollNo: 'DM004', email: 'steve@example.com', phone: '9876543228' },
  { name: 'Tony Stark', rollNo: 'DM005', email: 'tony@example.com', phone: '9876543229' },

  // Mobile App Development batch students
  { name: 'Uma Thurman', rollNo: 'MA001', email: 'uma@example.com', phone: '9876543230' },
  { name: 'Vin Diesel', rollNo: 'MA002', email: 'vin@example.com', phone: '9876543231' },
  { name: 'Will Smith', rollNo: 'MA003', email: 'will@example.com', phone: '9876543232' },
  { name: 'Xander Cage', rollNo: 'MA004', email: 'xander@example.com', phone: '9876543233' },
  { name: 'zahiya', rollNo: 'MA006', email: 'zahiya@example.com', phone: '9876543235' }
];

const pcs = [
  // Row 1 - Computer Science Lab
  { pcNumber: 'CS-01', rowNumber: 1 },
  { pcNumber: 'CS-02', rowNumber: 1 },
  { pcNumber: 'CS-03', rowNumber: 1 },
  { pcNumber: 'CS-04', rowNumber: 1 },
  { pcNumber: 'CS-05', rowNumber: 1 },
  { pcNumber: 'CS-06', rowNumber: 1 },
  { pcNumber: 'CS-07', rowNumber: 1 },
  { pcNumber: 'CS-08', rowNumber: 1 },

  // Row 2 - Software Lab
  { pcNumber: 'SS-01', rowNumber: 2 },
  { pcNumber: 'SS-02', rowNumber: 2 },
  { pcNumber: 'SS-03', rowNumber: 2 },
  { pcNumber: 'SS-04', rowNumber: 2 },
  { pcNumber: 'SS-05', rowNumber: 2 },
  { pcNumber: 'SS-06', rowNumber: 2 },
  { pcNumber: 'SS-07', rowNumber: 2 },
  { pcNumber: 'SS-08', rowNumber: 2 },

  // Row 3 - Multimedia Lab
  { pcNumber: 'MS-01', rowNumber: 3 },
  { pcNumber: 'MS-02', rowNumber: 3 },
  { pcNumber: 'MS-03', rowNumber: 3 },
  { pcNumber: 'MS-04', rowNumber: 3 },
  { pcNumber: 'MS-05', rowNumber: 3 },
  { pcNumber: 'MS-06', rowNumber: 3 },

  // Row 4 - CAD Lab
  { pcNumber: 'CD-01', rowNumber: 4 },
  { pcNumber: 'CD-02', rowNumber: 4 },
  { pcNumber: 'CD-03', rowNumber: 4 },
  { pcNumber: 'CD-04', rowNumber: 4 },
  { pcNumber: 'CD-05', rowNumber: 4 },
  { pcNumber: 'CD-06', rowNumber: 4 }
];

// Import data
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Batch.deleteMany();
    await Student.deleteMany();
    await PC.deleteMany();
    await LabBooking.deleteMany();
    await Attendance.deleteMany();

    console.log('Data Destroyed...');

    // Create users with hashed passwords
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log('Users Imported...');

    const adminUser = createdUsers.find(user => user.role === 'admin');
    const teacherUser = createdUsers.find(user => user.role === 'teacher');


    // Create batches with createdBy reference
    const batchesWithCreator = batches.map(batch => ({
      ...batch,
      createdBy: teacherUser._id
    }));

    const createdBatches = await Batch.insertMany(batchesWithCreator);
    console.log('Batches Imported...');

    // Create students with batch references
    const studentsWithBatch = students.map((student, index) => {
      const batchIndex = Math.floor(index / 5); // 5 students per batch
      return {
        ...student,
        batch: createdBatches[batchIndex]._id,
        contactInfo: {
          email: student.email,
          phone: student.phone
        }
      };
    });

    const createdStudents = await Student.insertMany(studentsWithBatch);
    console.log('Students Imported...');

    // Create PCs with createdBy reference
    const pcsWithCreator = pcs.map(pc => ({
      ...pc,
      createdBy: adminUser._id,
      specifications: {
        processor: 'Intel Core i5-10400',
        ram: '8GB DDR4',
        storage: '256GB SSD',
        graphics: 'Intel UHD Graphics',
        monitor: '22" LED'
      }
    }));

    const createdPCs = await PC.insertMany(pcsWithCreator);
    console.log('PCs Imported...');

    // Create sample bookings for testing
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sampleBookings = [
      // Yesterday's bookings (for testing "Apply Previous Bookings")
      {
        pc: createdPCs[0]._id,
        date: yesterday,
        timeSlot: '09:00-10:30',
        bookedBy: teacherUser._id,
        bookedFor: 'Alice Johnson',
        studentName: 'Alice Johnson',
        teacherName: 'John Teacher',
        purpose: 'AutoCAD Practice',
        batch: createdBatches[0]._id,
        student: createdStudents[0]._id,
        teacher: teacherUser._id,
        notes: 'AutoCAD Mechanical Drawing Session'
      },
      {
        pc: createdPCs[1]._id,
        date: yesterday,
        timeSlot: '09:00-10:30',
        bookedBy: teacherUser._id,
        bookedFor: 'Bob Smith',
        studentName: 'Bob Smith',
        teacherName: 'John Teacher',
        purpose: 'AutoCAD Practice',
        batch: createdBatches[0]._id,
        student: createdStudents[1]._id,
        teacher: teacherUser._id,
        notes: 'AutoCAD Mechanical Drawing Session'
      },
      {
        pc: createdPCs[8]._id, // SS-01
        date: yesterday,
        timeSlot: '10:30-12:00',
        bookedBy: teacherUser._id,
        bookedFor: 'Frank Miller',
        studentName: 'Frank Miller',
        teacherName: 'John Teacher',
        purpose: 'Web Development',
        batch: createdBatches[1]._id,
        student: createdStudents[5]._id,
        teacher: teacherUser._id,
        notes: 'HTML/CSS Practice Session'
      },
      {
        pc: createdPCs[9]._id, // SS-02
        date: yesterday,
        timeSlot: '10:30-12:00',
        bookedBy: teacherUser._id,
        bookedFor: 'Grace Kelly',
        studentName: 'Grace Kelly',
        teacherName: 'John Teacher',
        purpose: 'Web Development',
        batch: createdBatches[1]._id,
        student: createdStudents[6]._id,
        teacher: teacherUser._id,
        notes: 'HTML/CSS Practice Session'
      },
      {
        pc: createdPCs[16]._id, // MS-01
        date: yesterday,
        timeSlot: '12:00-13:30',
        bookedBy: adminUser._id,
        bookedFor: 'Kate Winslet',
        studentName: 'Kate Winslet',
        teacherName: 'Admin User',
        purpose: 'Data Science Lab',
        batch: createdBatches[2]._id,
        student: createdStudents[10]._id,
        teacher: adminUser._id,
        notes: 'Python Data Analysis Session'
      },

      // Today's bookings (for testing conflicts)
      {
        pc: createdPCs[2]._id,
        date: today,
        timeSlot: '09:00-10:30',
        bookedBy: teacherUser._id,
        bookedFor: 'Charlie Brown',
        studentName: 'Charlie Brown',
        teacherName: 'John Teacher',
        purpose: 'AutoCAD Practice',
        batch: createdBatches[0]._id,
        student: createdStudents[2]._id,
        teacher: teacherUser._id,
        notes: 'AutoCAD Mechanical Drawing Session'
      },
      {
        pc: createdPCs[10]._id, // SS-03
        date: today,
        timeSlot: '10:30-12:00',
        bookedBy: teacherUser._id,
        bookedFor: 'Henry Ford',
        studentName: 'Henry Ford',
        teacherName: 'John Teacher',
        purpose: 'Web Development',
        batch: createdBatches[1]._id,
        student: createdStudents[7]._id,
        teacher: teacherUser._id,
        notes: 'JavaScript Practice Session'
      },
      {
        pc: createdPCs[22]._id, // CD-01
        date: today,
        timeSlot: '14:00-15:30',
        bookedBy: adminUser._id,
        bookedFor: 'Paul Walker',
        studentName: 'Paul Walker',
        teacherName: 'Admin User',
        purpose: 'Digital Marketing Lab',
        batch: createdBatches[3]._id,
        student: createdStudents[15]._id,
        teacher: adminUser._id,
        notes: 'Social Media Marketing Session'
      },

      // Tomorrow's bookings
      {
        pc: createdPCs[20]._id, // MA-05
        date: tomorrow,
        timeSlot: '15:30-17:00',
        bookedBy: teacherUser._id,
        bookedFor: 'Uma Thurman',
        studentName: 'Uma Thurman',
        teacherName: 'Sarah Wilson',
        purpose: 'Mobile App Development',
        batch: createdBatches[4]._id,
        student: createdStudents[20]._id,
        teacher: createdUsers[2]._id, // Sarah Wilson
        notes: 'React Native Development Session'
      }
    ];

    await LabBooking.insertMany(sampleBookings);
    console.log('Sample Bookings Imported...');

    // Create sample attendance records for the past 2 weeks
    const attendanceRecords = [];

    // Create attendance for the past 14 days (2 weeks)
    for (let i = 0; i < 14; i++) {
      const attendanceDate = new Date(today);
      attendanceDate.setDate(today.getDate() - i);

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) {
        continue;
      }

      createdStudents.forEach(student => {
        // Vary attendance rates by day (more realistic)
        let attendanceRate = 0.85; // Base 85% attendance

        // Monday and Friday have slightly lower attendance
        if (attendanceDate.getDay() === 1 || attendanceDate.getDay() === 5) {
          attendanceRate = 0.80;
        }

        // Random variation
        const randomFactor = Math.random() * 0.1 - 0.05; // ±5%
        attendanceRate += randomFactor;

        // Ensure rate is between 0.7 and 0.95
        attendanceRate = Math.max(0.7, Math.min(0.95, attendanceRate));

        let status = 'present';
        const rand = Math.random();

        if (rand > attendanceRate) {
          status = rand > attendanceRate + 0.05 ? 'absent' : 'late';
        }

        attendanceRecords.push({
          student: student._id,
          batch: student.batch,
          date: attendanceDate,
          status: status,
          markedBy: teacherUser._id
        });
      });
    }

    await Attendance.insertMany(attendanceRecords);
    console.log('Sample Attendance Imported...');

    console.log('Data Imported Successfully!');
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@caddcentre.com / Admin@123456');
    console.log('Teacher: john@caddcentre.com / Teacher@123456');
    console.log('Teacher: sarah@caddcentre.com / Teacher@123456');
    console.log('========================\n');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Destroy data
const destroyData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Batch.deleteMany();
    await Student.deleteMany();
    await PC.deleteMany();
    await LabBooking.deleteMany();
    await Attendance.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
