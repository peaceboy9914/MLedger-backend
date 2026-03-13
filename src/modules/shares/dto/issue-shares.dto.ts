import { IsInt, IsUUID, Min } from "class-validator";

export class IssueSharesDto {
    @IsUUID()
    shareholderId: string;

    @IsInt()
    @Min(1)
    shares: number;
}