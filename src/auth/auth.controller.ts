import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/auth.schema';
import { Model } from 'mongoose';

@ApiTags('users')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @ApiCreatedResponse({ type: CreateUserDto })
  @Post('/sign-up')
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('/sign-in')
  signIn(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signIn(loginUserDto);
  }

  @ApiOkResponse({
    type: User,
    description: 'The users Id should sent as a parameter in the url',
  })
  @Get('/profile/:id')
  getUserProfile(@Param('id') id: string) {
    return this.authService.getUserProfile(id);
  }
}
