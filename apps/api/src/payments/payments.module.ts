import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ChargilyService } from './chargily.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, ChargilyService, StripeService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
