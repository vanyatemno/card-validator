# Cards Validator

A NestJS-based banking card validation service that validates credit/debit card numbers using the Luhn algorithm, checks card number length, and validates expiry dates.

## What This Project Does

This project provides a REST API service for validating banking cards. It performs comprehensive validation including:

- **Card Number Validation**: Uses the Luhn algorithm to verify card number authenticity
- **Length Validation**: Ensures card numbers are 13, 15, or 16 digits (supporting Visa, Mastercard, American Express)
- **Expiry Date Validation**: Checks that the card hasn't expired based on current date
- **Input Validation**: Validates request parameters using class-validator decorators

The service follows clean architecture principles with clear separation of concerns across domain, application, and infrastructure layers.

## Project Structure

```
cards-validator/
├── src/
│   ├── application/           # Application layer (controllers, DTOs)
│   │   ├── controllers/       # Сontrollers
│   │   │   └── cards.controller.ts
│   │   └── dtos/             # Data Transfer Objects
│   │       └── cards.dto.ts
│   ├── domain/               # Domain layer (business logic)
│   │   ├── exception/        # Custom exceptions
│   │   │   └── cardValidationException.ts
│   │   ├── interceptors/     # Response interceptors
│   │   │   ├── cards-response.interceptor.ts
│   │   │   └── logger.interceptor.ts
│   │   ├── modules/          # Domain modules
│   │   │   └── cards.module.ts
│   │   └── services/         # Business logic services
│   │       ├── cards.service.ts
│   │       └── common/
│   │           └── logger.service.ts
│   ├── infrastructure/       # Infrastructure layer (config, modules)
│   │   ├── config/          # Configuration files
│   │   │   └── config.ts
│   │   └── modules/         # Application modules
│   │       └── app.module.ts
│   └── main.ts              # Application entry point
├── __tests__/               # Test files
│   ├── e2e/                # End-to-end tests
│   │   └── app.e2e-spec.ts
│   └── services/           # Unit tests
│       └── cards.service.spec.ts
├── docker-compose.yaml      # Docker Compose configuration
├── Dockerfile              # Docker container definition
└── package.json            # Dependencies and scripts
```

## Prerequisites

### Technologies Used

- **Node.js** (v24+)
- **NestJS** (v11+) - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Class Validator** - Validation decorators
- **Class Transformer** - Object transformation
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework
- **Docker** - Containerization

### System Requirements

- Node.js 24 or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

## Running the Project

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   ```

3. **Start development server:**
   ```bash
   npm run start:dev
   ```

4. **Access the application:**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

1. **Using Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Using Docker directly:**
   ```bash
   # Build the image
   docker build -t cards-validator .

   # Run the container
   docker run -p 3000:3000 -e PORT=3000 cards-validator
   ```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e:new

# Run e2e tests with Docker
npm run test:e2e:docker

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Card Validation Analysis

### How Card Validation Works

The `CardsValidatorService` in `src/domain/services/cards.service.ts` implements a comprehensive card validation system with three main validation steps:

#### 1. Card Number Length Validation (`validateCardNumberLength`)
```typescript
private validateCardNumberLength({ cardNumber }: CardValidationRequestDto): void {
  if (![13, 15, 16].includes(cardNumber.length)) {
    throw new CardValidationException('Wrong card number length');
  }
}
```
- **Purpose**: Ensures the card number has a valid length
- **Accepted Lengths**:
  - 13 digits: Some Visa cards
  - 15 digits: American Express cards
  - 16 digits: Most Visa, Mastercard, and other major cards
- **Validation**: Throws `CardValidationException` if length is invalid

#### 2. Expiry Date Validation (`validateDate`)
```typescript
private validateDate(cardDto: CardValidationRequestDto): void {
  const currentDate = new Date();
  const isValid = 
    (currentDate.getFullYear() === cardDto.expiryYear && 
     currentDate.getMonth() <= cardDto.expiryMonth) ||
    currentDate.getFullYear() < cardDto.expiryYear;
  
  if (!isValid) {
    throw new CardValidationException('Card has expired');
  }
}
```
- **Purpose**: Verifies the card hasn't expired
- **Logic**: 
  - Cards are valid if expiry year is in the future
  - For current year, card is valid if expiry month >= current month
  - Note: `getMonth()` returns 0-11, but input month is 1-12
- **Validation**: Throws `CardValidationException` if card has expired

#### 3. Luhn Algorithm Validation (`validateCardNumber`)
```typescript
private validateCardNumber({ cardNumber }: CardValidationRequestDto): void {
  const nums = cardNumber.split('').map(Number);
  const sum = nums.reduce((acc, cur, index) => {
    if (index % 2 === 1) {
      return acc + cur;
    } else if (cur * 2 > 9) {
      return acc + ((cur * 2) % 10) + 1;
    } else {
      return acc + cur * 2;
    }
  }, 0);
  
  if (sum % 10 !== 0) {
    throw new CardValidationException(
      'Invalid card number (failed Luhn algorithm check)'
    );
  }
}
```
- **Purpose**: Validates card number authenticity using the Luhn algorithm
- **Algorithm Steps**:
  1. Convert card number to array of digits
  2. Starting from the right, double every second digit (odd indices in 0-based array)
  3. If doubling results in a number > 9, subtract 9 (equivalent to `(n % 10) + 1`)
  4. Sum all digits
  5. If sum is divisible by 10, the card number is valid
- **Validation**: Throws `CardValidationException` if Luhn check fails

#### Validation Flow
The `validate` method orchestrates all validations:
1. **Length Check** → **Date Check** → **Luhn Check**
2. If all validations pass, returns `true`
3. If any validation fails, throws `CardValidationException`

## Available Endpoints and DTOs

### Endpoints

#### `GET /cards/validate`
Validates a credit/debit card using query parameters.

**Query Parameters:**
- `cardNumber` (string, required): The card number to validate
- `expiryYear` (number, required): Card expiry year (e.g., 2025)
- `expiryMonth` (number, required): Card expiry month (1-12)

**Example Request:**
```bash
curl "http://localhost:3000/cards/validate?cardNumber=4111111111111111&expiryYear=2025&expiryMonth=12"
```

**Success Response (200):**
```json
{
  "valid": true
}
```

**Error Response (400):**
```json
{
  "valid": false,
  "error": {
    "code": 400,
    "message": "Card has expired"
  }
}
```

### DTOs (Data Transfer Objects)

#### `CardValidationRequestDto`
Located in `src/application/dtos/cards.dto.ts`

```typescript
export class CardValidationRequestDto {
  @IsDefined({ message: 'Card number has to be defined' })
  @IsString({ message: 'Card number has to be a string' })
  @MaxLength(16, { message: 'Card number is too long' })
  cardNumber: string;

  @IsDefined()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1900)
  expiryYear: number;

  @IsDefined()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @Max(12)
  expiryMonth: number;
}
```

**Validation Rules:**
- `cardNumber`: Required string, max 16 characters
- `expiryYear`: Required number, minimum 1900, auto-transformed from string
- `expiryMonth`: Required number, range 1-12, auto-transformed from string

### API Documentation

The API includes Swagger/OpenAPI documentation available at:
- **Local**: http://localhost:3000/api

### Example Valid Card Numbers for Testing

- **Visa**: `4111111111111111`, `4532015112830366`
- **Mastercard**: `5555555555554444`
- **American Express**: `372449635398432`, `340000005000009`
- **13-digit Visa**: `4000002000018`

All test card numbers pass the Luhn algorithm validation and can be used with future expiry dates for testing purposes.
