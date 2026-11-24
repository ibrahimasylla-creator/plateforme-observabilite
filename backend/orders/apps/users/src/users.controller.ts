import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertUserDto } from './dto/upsert-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un utilisateur de test' })
  create(@Body() dto: UpsertUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs' })
  list() {
    return this.usersService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un utilisateur" })
  get(@Param('id') id: string) {
    return this.usersService.get(id);
  }

  @Put(':id')
  @ApiOperation({ summary: "Garantit l'existence d'un utilisateur (le crée s'il est inconnu)" })
  ensure(@Param('id') id: string, @Body() dto: UpsertUserDto) {
    return this.usersService.ensure(id, dto);
  }
}
