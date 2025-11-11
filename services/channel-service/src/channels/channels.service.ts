import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async findAll(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });
  }
}
