import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/auth.schema';
import { Model } from 'mongoose';
import { Request } from 'express';

// @ApiTags('User')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @ApiCreatedResponse({ type: CreateUserDto })
  @Post('/sign-up')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('/sign-in')
  async signIn(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signIn(loginUserDto);
  }

  // @ApiTags('User')
  @ApiOkResponse({
    type: User,
    description: 'The userId sent as a parameter in the url',
  })
  @Get('/profile/:id')
  async getUserProfile(@Param('id') id: string, @Req() req: Request) {
    return this.authService.getUserProfile(id);
  }
}
