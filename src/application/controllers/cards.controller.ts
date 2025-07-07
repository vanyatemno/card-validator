import {
  Body,
  Controller,
  Get,
  Header,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CardsValidatorService } from '../../domain/services/cards.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CardValidationRequestDto,
  CardValidationSuccessResponseDto,
  CardValidationErrorResponseDto
} from '../dtos';
import { CardsResponseInterceptor } from '../../domain/interceptors';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsValidatorService) {}

  @ApiOperation({ summary: 'Validates a card' })
  @ApiResponse({
    status: 200,
    description: 'Card validation successful',
    type: CardValidationSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Card validation failed due to invalid input or validation errors',
    type: CardValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: CardValidationErrorResponseDto,
  })
  @Header('content-type', 'application/json')
  @UseInterceptors(CardsResponseInterceptor)
  @Get('validate')
  validateCardInfo(@Query() card: CardValidationRequestDto) {
    return this.cardsService.validate(card);
  }
}
