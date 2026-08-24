import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserRepository } from '../Repositories/user.repository';
import { Tenant } from '../models/tenant.entity';
import { User, UserRole } from '../models/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) { }

  // 1. Registro Público: Crea Tenant + Usuario Owner
  async registerTenant(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, { where: { email: data.userEmail } });
      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }

      const tenant = new Tenant();
      tenant.name = data.tenantName;
      const savedTenant = await queryRunner.manager.save(tenant);
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(data.userPassword, salt);

      const user = new User();
      user.tenantId = savedTenant.id;
      user.name = data.userName;
      user.email = data.userEmail;
      user.password = hashedPassword;
      user.role = UserRole.ADMIN;

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      const { password, ...result } = savedUser;
      return { tenant: savedTenant, owner: result };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(email: string, pass: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async createMember(adminUser: any, data: any) {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create users');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      tenantId: adminUser.tenantId, // Forzar que sea del mismo tenant
      role: data.role || UserRole.STAFF
    });

    const { password, ...result } = user;
    return result;
  }
}
