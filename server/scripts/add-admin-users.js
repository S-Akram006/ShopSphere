const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');

const createAdminStaffUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';
    console.log(`[Add Users] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const passwordHash = await bcrypt.hash('1234567890', 10);

    const usersToCreate = [
      {
        name: 'Platform Admin',
        email: 'test@mail.com',
        role: 'Platform Admin',
        passwordHash,
        isActive: true,
      },
      {
        name: 'Support Agent',
        email: 'test2@mail.com',
        role: 'Support Agent',
        passwordHash,
        isActive: true,
      },
      {
        name: 'Delivery Partner',
        email: 'test3@mail.com',
        role: 'Delivery Partner',
        passwordHash,
        isActive: true,
      },
      {
        name: 'Delivery Partner (tets3)',
        email: 'tets3@mail.com',
        role: 'Delivery Partner',
        passwordHash,
        isActive: true,
      },
    ];

    for (const userData of usersToCreate) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        existing.passwordHash = passwordHash;
        existing.role = userData.role;
        existing.isActive = true;
        await existing.save();
        console.log(`Updated user: ${userData.email} (${userData.role})`);
      } else {
        await User.create(userData);
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('All requested accounts have been successfully created/updated.');
    process.exit(0);
  } catch (err) {
    console.error('[Add Users] Error:', err);
    process.exit(1);
  }
};

createAdminStaffUsers();
