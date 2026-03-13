import { CreateShareholderDto } from "./create-shareholder.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateshareholderDto extends PartialType(CreateShareholderDto) {}