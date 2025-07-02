import {
  Body,
  Controller,
  Get,
  Header,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CardsValidatorService } from '../../domain/services/cards.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CardValidationRequestDto } from '../dtos';
import { CardsResponseInterceptor } from '../../domain/interceptors';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsValidatorService) {}

  @ApiOperation({ summary: 'Validates a card' })
  @ApiResponse({
    status: 200,
    description: 'Returns a result of card validation',
    type: CardValidationRequestDto,
  })
  @ApiQuery({
    name: 'cardNumber',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'expiryYear',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'expiryMonth',
    type: String,
    required: true,
  })
  @Header('content-type', 'application/json')
  @UseInterceptors(CardsResponseInterceptor)
  @Get('validate')
  validateCardInfo(@Query() card: CardValidationRequestDto) {
    return this.cardsService.validate(card);
  }
}
