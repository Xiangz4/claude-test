import { IsNotEmpty, IsString, IsNumber, IsPositive, Matches } from 'class-validator';

export class CreateQuoteLockDto {
  @IsNotEmpty()
  @IsString()
  merchantId: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{3}\/[A-Z]{3}$/, {
    message: 'currencyPair must be in format BASE/QUOTE (e.g., USD/HKD)',
  })
  currencyPair: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'sellCurrency must be a 3-letter currency code',
  })
  sellCurrency: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  sellAmount: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'buyCurrency must be a 3-letter currency code',
  })
  buyCurrency: string;
}
