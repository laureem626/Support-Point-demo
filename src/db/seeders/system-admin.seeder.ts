import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { hashPassword } from '../../common/utils/password-hash';
import { Designation } from 'src/common/enums/issue.enum';

export const seedSystemAdmin = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);

  const adminMobile = '255784082951';
  const existingAdmin = await userRepository.findOne({
    where: { mobile: adminMobile },
  });

  if (existingAdmin) {
    console.log('⚠️ System admin already exists');
    return;
  }

  const hashedPassword = await hashPassword('123456');

  const adminUser = userRepository.create({
    firstName: 'System',
    lastName: 'Administrator',
    designation: Designation.SYSTEM_ADMIN,
    mobile: adminMobile,
    isActive: true,
    password: hashedPassword,
  });

  await userRepository.save(adminUser);
  console.log('✅ Seeded: System Admin User');
};
