import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ship } from './ship.entity';
import { CreateShipDto, UpdateShipDto } from './ship.dto';

@Injectable()
export class ShipService {
  constructor(
    @InjectRepository(Ship)
    private shipRepository: Repository<Ship>,
  ) {}

  async findAll(): Promise<Ship[]> {
    return this.shipRepository.find();
  }

  async findOne(id: string): Promise<Ship> {
    const ship = await this.shipRepository.findOne({ where: { id } });
    if (!ship) {
      throw new NotFoundException(`船舶 ${id} 不存在`);
    }
    return ship;
  }

  async findByCode(shipCode: string): Promise<Ship> {
    const ship = await this.shipRepository.findOne({ where: { shipCode } });
    if (!ship) {
      throw new NotFoundException(`船舶编码 ${shipCode} 不存在`);
    }
    return ship;
  }

  async create(createShipDto: CreateShipDto): Promise<Ship> {
    const existingShip = await this.shipRepository.findOne({
      where: { shipCode: createShipDto.shipCode },
    });
    if (existingShip) {
      throw new ConflictException(`船舶编码 ${createShipDto.shipCode} 已存在`);
    }

    const ship = this.shipRepository.create(createShipDto);
    return this.shipRepository.save(ship);
  }

  async update(id: string, updateShipDto: UpdateShipDto): Promise<Ship> {
    const ship = await this.findOne(id);

    if (updateShipDto.shipCode && updateShipDto.shipCode !== ship.shipCode) {
      const existingShip = await this.shipRepository.findOne({
        where: { shipCode: updateShipDto.shipCode },
      });
      if (existingShip) {
        throw new ConflictException(`船舶编码 ${updateShipDto.shipCode} 已存在`);
      }
    }

    Object.assign(ship, updateShipDto);
    return this.shipRepository.save(ship);
  }

  async delete(id: string): Promise<void> {
    const ship = await this.findOne(id);
    await this.shipRepository.remove(ship);
  }
}
