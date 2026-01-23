import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ItemType,
  ItemServiceKind,
  ItemDurationUnit,
} from '../../../../database/entities/item.entity';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(ItemType)
  type: ItemType;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // Required for SERVICE type
  @ValidateIf((o: CreateItemDto) => o.type === ItemType.SERVICE)
  @IsNotEmpty({ message: 'serviceKind is required for SERVICE type' })
  @IsEnum(ItemServiceKind)
  serviceKind?: ItemServiceKind;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Required for MEMBERSHIP and PT_SESSION
  @ValidateIf(
    (o: CreateItemDto) =>
      o.serviceKind === ItemServiceKind.MEMBERSHIP ||
      o.serviceKind === ItemServiceKind.PT_SESSION,
  )
  @IsNotEmpty({
    message: 'durationValue is required for membership/PT session',
  })
  @IsNumber()
  @IsPositive()
  durationValue?: number;

  @ValidateIf(
    (o: CreateItemDto) =>
      o.serviceKind === ItemServiceKind.MEMBERSHIP ||
      o.serviceKind === ItemServiceKind.PT_SESSION,
  )
  @IsNotEmpty({ message: 'durationUnit is required for membership/PT session' })
  @IsEnum(ItemDurationUnit)
  durationUnit?: ItemDurationUnit;

  // Required for PT_SESSION only
  @ValidateIf(
    (o: CreateItemDto) => o.serviceKind === ItemServiceKind.PT_SESSION,
  )
  @IsNotEmpty({ message: 'sessionCount is required for PT_SESSION' })
  @IsNumber()
  @IsPositive()
  sessionCount?: number;

  // Optional for MEMBERSHIP (package with included PT sessions)
  @ValidateIf(
    (o: CreateItemDto) => o.serviceKind === ItemServiceKind.MEMBERSHIP,
  )
  @IsOptional()
  @IsNumber()
  @Min(0)
  includedPtSessions?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
