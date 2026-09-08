import { DataSource } from 'typeorm';

import { User } from '../../modules/users/entities/user.entity';
import { Designation as DesignationEntity } from '../../modules/users/entities/designation.entity';

import { hashPassword } from '../../common/utils/password-hash';

import {
  Designation,
} from 'src/common/enums/issue.enum';

export const seedSystemAdmin = async (
  dataSource: DataSource,
) => {
  const userRepository =
    dataSource.getRepository(User);

  const designationRepository =
    dataSource.getRepository(DesignationEntity);

  const adminMobile = '255784082951';

  // Find existing System Admin
  let adminUser = await userRepository.findOne({
    where: {
      mobile: adminMobile,
    },
  });

  // ==========================================
  // CREATE SYSTEM ADMIN USER IF NOT EXISTS
  // ==========================================
  if (!adminUser) {
    const hashedPassword =
      await hashPassword('123456');

    const newAdmin = userRepository.create({
      firstName: 'System',
      lastName: 'Administrator',
      mobile: adminMobile,
      isActive: true,
      password: hashedPassword,
    });

    adminUser =
      await userRepository.save(newAdmin);

    console.log('Created System Admin User');
  } else {
    console.log(
      'System admin already exists',
    );
  }

  // ==========================================
  // CHECK SYSTEM ADMIN DESIGNATION
  // ==========================================
  const existingDesignation =
    await designationRepository.findOne({
      where: {
        userId: adminUser.id,
        designation: Designation.SYSTEM_ADMIN,
      },
    });

  // ==========================================
  // CREATE DESIGNATION IF MISSING
  // ==========================================
  if (!existingDesignation) {
    const adminDesignation =
      designationRepository.create({
        designation:
          Designation.SYSTEM_ADMIN,
        userId: adminUser.id,
      });

    await designationRepository.save(
      adminDesignation,
    );

    console.log(
      'Assigned SYSTEM_ADMIN designation',
    );
  } else {
    console.log(
      'System Admin already has SYSTEM_ADMIN designation',
    );
  }

  const existingDeveloper =
    await designationRepository.findOne({
      where: {
        userId: adminUser.id,
        designation:
          Designation.DEVS,
      },
    });

  if (!existingDeveloper) {
    const developerDesignation =
      designationRepository.create({
        designation:
          Designation.DEVS,
        userId: adminUser.id,
      });

    await designationRepository.save(
      developerDesignation,
    );

    console.log(
      'Assigned DEVELOPER designation',
    );
  } else {
    console.log(
      'System Admin already has DEVELOPER designation',
    );
  
  console.log(
    'System Admin seeding completed',
  );
};}