import { IsInt, IsUUID, Min, min } from "class-validator";

export class TransferSharesDto {

    @IsUUID()
    fromShareholderId: string;

    @IsUUID()
    toShareholderId: string;

    @IsInt()
    @Min(1)
    shares: number;
}