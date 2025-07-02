# Cards Validator

A NestJS-based REST API service for validating banking card information using industry-standard validation algorithms including the Luhn algorithm for card number verification.

## What This Project Does

This project provides a robust card validation service that validates:
- **Card Number Format**: Ensures card numbers are 13, 15, or 16 digits long
- **Card Number Validity**: Uses the Luhn algorithm to verify card number authenticity
- **Expiry Date Validation**: Checks that the card hasn't expired based on current date

The service exposes a RESTful API endpoint that accepts card details and returns validation results with proper error handling and detailed error messages.

## Project Structure

The project follows **Clean Architecture** principles with **Domain-Driven Design**, organized into three main layers:

```
src/
├── application/          # Application Layer
│   ├── controllers/      # REST API controllers
│   │   └── cards.controller.ts
│   └── dtos/             # Data Transfer Objects
│       └── cards.dto.ts
├── domain/               # Domain Layer (Business Logic)
│   ├── exception/        # Custom exceptions
│   │   └── cardValidationException.ts
│   ├── interceptors/     # Response interceptors
│   │   ├── cards-response.interceptor.ts
│   │   └── logger.interceptor.ts
│   ├── modules/          # Domain modules
│   │   └── cards.module.ts
│   └── services/         # Business logic services
│       ├── cards.service.ts
│       └── common/
│           └── logger.service.ts
├── infrastructure/       # Infrastructure Layer
│   ├── config/           # Configuration management
│   │   └── config.ts
│   └── modules/          # Application modules
│       └── app.module.ts
└── main.ts               # Application entry point

__tests__/                # Test suites
├── e2e/                  # End-to-end tests
├── services/             # Unit tests
└── jest-e2e.json         # E2E test configuration
```

## Prerequisites and Technologies

### Prerequisites
- **Node.js**: Version 18+ (recommended: 24+)
- **npm**: Version 8+ (comes with Node.js)
- **Docker**: Optional, for containerized deployment

### Technologies Used

#### Core Framework
- **NestJS**: Progressive Node.js framework for building scalable server-side applications
- **TypeScript**: Strongly typed programming language
- **Express**: Web application framework (NestJS default)

#### Validation & Documentation
- **class-validator**: Decorator-based validation library
- **class-transformer**: Object transformation library
- **Swagger/OpenAPI**: API documentation and testing interface

#### Testing
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for testing APIs

#### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript ESLint**: TypeScript-specific linting rules

## Running the Project

### Local Development

1. **Clone and install dependencies:**
```bash
git clone https://github.com/vanyatemno/card-validator.git
cd cards-validator
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env file and set PORT (default: 3000)
```

3. **Start development server:**
```bash
npm run start:dev
```

4. **Access the application:**
- API: `http://localhost:3000`
- Swagger Documentation: `http://localhost:3000/api`

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

#### Using Docker Compose (Recommended)
```bash
# Set up environment file
cp .env.example .env
# Edit .env and set PORT value

# Build and run with Docker Compose
docker-compose up --build
```

### Running Tests

```bash
# Run unit tests only
npm run test:unit

# Run unit tests with Docker
npm run test:unit:docker

# Run e2e tests
npm run test:e2e

# Run e2e tests with Docker
npm run test:e2e:docker
```

## Card Validation Analysis

### How Card Validation Works

The card validation process in `src/domain/services/cards.service.ts` implements a multi-step validation approach:

#### 1. **Card Number Length Validation**
```typescript
private validateCardNumberLength({ cardNumber }: CardValidationRequestDto): void {
  if (!this.permittedCardNumberLength.includes(cardNumber.length)) {
    throw new CardValidationException('Wrong card number length');
  }
}
```

#### 2. **Expiry Date Validation**
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
This validates that the card hasn't expired by comparing the expiry year/month with the current date.

#### 3. **Luhn Algorithm Validation**
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

The **Luhn Algorithm** works by:
1. Starting from the rightmost digit, double every second digit
2. If doubling results in a number > 9, add the digits
3. Sum all digits
4. If the total sum is divisible by 10, the card number is valid

#### 4. **Validation Flow**
The main `validate()` method orchestrates the validation:
```typescript
public validate(cardDto: CardValidationRequestDto): boolean {
  this.validateCardNumberLength(cardDto);
  this.validateDate(cardDto);
  this.validateCardNumber(cardDto);
  return true;
}
```

## Available Endpoints and DTOs

### API Endpoints

#### `GET /cards/validate`
Validates card information using query parameters.

**Query Parameters:**
- `cardNumber` (string, required): Card number (max 16 digits)
- `expiryYear` (number, required): Expiry year (minimum 1900)
- `expiryMonth` (number, required): Expiry month (1-12)

**Example Request:**
```bash
GET /cards/validate?cardNumber=4111111111111111&expiryYear=2025&expiryMonth=12
```

### Data Transfer Objects (DTOs)

#### Request DTO
```typescript
class CardValidationRequestDto {
  cardNumber: string;    // Max 16 characters, required
  expiryYear: number;    // Min 1900, required
  expiryMonth: number;   // 1-12, required
}
```

#### Success Response DTO
```typescript
class CardValidationSuccessResponseDto {
  valid: boolean;        // Always true for successful validation
}
```

**Example Success Response:**
```json
{
  "valid": true
}
```

#### Error Response DTO
```typescript
class CardValidationErrorResponseDto {
  valid: boolean;        // Always false for failed validation
  error: {
    code: number;        // HTTP status code
    message: string;     // Error description
  }
}
```

**Example Error Response:**
```json
{
  "valid": false,
  "error": {
    "code": 400,
    "message": "Card has expired"
  }
}
```

### API Documentation

The project includes comprehensive Swagger/OpenAPI documentation available at:
- **Local**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

The Swagger interface provides:
- Interactive API testing
- Request/response schemas
- Example payloads
- Error code documentation
