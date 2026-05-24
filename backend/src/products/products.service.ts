// src/products/products.service.ts
import {
  Injectable, Inject, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { MongoClient, ObjectId } from 'mongodb';
import { MONGO_CLIENT } from '../database/mongodb/mongodb.provider';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.interface';

@Injectable()
export class ProductsService {
  private get col() {
    return this.mongo.db().collection<Product>('products');
  }

  constructor(
    @Inject(MONGO_CLIENT) private readonly mongo: MongoClient,
  ) {}

  async create(storeId: string, dto: CreateProductDto): Promise<Product> {
    const now = new Date();
    const product: Product = {
      store_id:         storeId,
      title:            dto.title,
      sku:              dto.sku,
      price:            dto.price,
      ...(dto.compare_at_price !== undefined && { compare_at_price: dto.compare_at_price }),
      stock:            dto.stock,
      description:      dto.description,
      images:           dto.images ?? [],
      variants:         dto.variants ?? [],
      attributes:       dto.attributes ?? {},
      is_active:        true,
      created_at:       now,
      updated_at:       now,
    };

    const result = await this.col.insertOne(product);
    return { ...product, _id: result.insertedId };
  }

  async findByStore(storeId: string): Promise<Product[]> {
    return this.col.find({ store_id: storeId, is_active: true }).toArray();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.col.findOne({ _id: new ObjectId(id) });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(
    id: string,
    storeId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findById(id);
    if (product.store_id !== storeId)
      throw new ForbiddenException('Este producto no pertenece a tu tienda');

    const result = await this.col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...dto, updated_at: new Date() } },
      { returnDocument: 'after' },
    );
    return result!;
  }

  async delete(id: string, storeId: string): Promise<void> {
    const product = await this.findById(id);
    if (product.store_id !== storeId)
      throw new ForbiddenException('Este producto no pertenece a tu tienda');

    // Soft delete
    await this.col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { is_active: false, updated_at: new Date() } },
    );
  }
}