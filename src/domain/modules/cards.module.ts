import { CardsValidatorService } from '../services/cards.service';
import { Module } from '@nestjs/common';
import { CardsController } from '../../application/controllers';

@Module({
  imports: [],
  controllers: [CardsController],
  providers: [CardsValidatorService],
})
export class CardsModule {}
