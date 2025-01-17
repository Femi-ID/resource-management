import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/auth.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from './dto/login-user.dto';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async signUp(createUserDto: CreateUserDto) {
    const { firstName, lastName, email, password, confirmPassword } =
      createUserDto;

    if (password !== confirmPassword)
      throw new BadRequestException(
        `Password and confirmPassword fields do not match`,
      );

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    return { message: 'User successfully logged in', user_details: newUser };
  }

  async signIn(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // verify user password
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { message: 'User successfully logged in', userId: user.id };
  }

  async getUserProfile(id: string) {
    const isValid = isValidObjectId(id);
    if (!isValid) throw new BadRequestException(`Invalid user id: ${id}`);

    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(`Admin-user not found`);

    return user;
  }
}
