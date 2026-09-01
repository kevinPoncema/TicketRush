import { 
  UserAlreadyExistsException, 
  SelfDeletionNotAllowedException, 
  InvalidCredentialsException,
  TicketNotFoundException,
  UnauthorizedTenantAccessException,
  InvalidCryptographicSignatureException,
  TicketAlreadyUsedException,
  InvalidTicketStatusException,
  CloudStorageException,
  EventNotFoundException,
  OrderAlreadyProcessedException,
  MissingParameterException,
  TicketSoldOutException,
  OrderNotFoundException
} from '../exceptions';
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
  ) {}

  async registerTenant(data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, { where: { email: data.userEmail } });
      if (existingUser) {
        throw new UserAlreadyExistsException();
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
    if (!user) throw new InvalidCredentialsException();

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new InvalidCredentialsException();

    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async listMembers(tenantId: string) {
    return this.userRepository.findByTenantId(tenantId);
  }

  async deleteMember(adminUser: any, memberId: string) {
    if (adminUser.id === memberId) {
      throw new SelfDeletionNotAllowedException();
    }
    await this.userRepository.deleteByIdAndTenant(memberId, adminUser.tenantId);
  }

  async createMember(adminUser: any, data: any) {
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
