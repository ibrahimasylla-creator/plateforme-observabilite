import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@app/database';
import { UpsertUserDto } from './dto/upsert-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  list() {
    return this.db.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async create(dto: UpsertUserDto) {
    try {
      return await this.db.user.create({ data: dto });
    } catch (error) {
      this.rethrowIfDuplicate(error);
      throw error;
    }
  }

  /** Garantit l'existence de l'utilisateur : le crée s'il est inconnu, sinon le renvoie tel quel. */
  async ensure(id: string, dto: UpsertUserDto) {
    try {
      return await this.db.user.upsert({
        where: { id },
        update: {},
        create: { id, ...dto },
      });
    } catch (error) {
      this.rethrowIfDuplicate(error);
      throw error;
    }
  }

  private rethrowIfDuplicate(error: unknown): void {
    if ((error as { code?: string }).code === 'P2002') {
      throw new ConflictException('Email already used');
    }
  }
}
