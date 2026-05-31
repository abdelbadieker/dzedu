import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { ChargilyService } from './chargily.service';
import { StripeService } from './stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly chargilyService: ChargilyService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('chargily-webhook')
  @HttpCode(200)
  async chargilyWebhook(
    @Req() req: any,
    @Headers('x-chargily-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? JSON.stringify(req.body);

    if (!this.chargilyService.verifySignature(rawBody, signature)) {
      throw new BadRequestException('INVALID_SIGNATURE');
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (event.type !== 'invoice.paid') {
      return { received: true };
    }

    return this.chargilyService.handleInvoicePaid(event.data);
  }

  @Post('stripe-webhook')
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? JSON.stringify(req.body);
    const event = this.stripeService.constructEvent(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.stripeService.handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await this.stripeService.handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.stripeService.handleSubscriptionDeleted(event.data.object);
        break;
    }

    return { received: true };
  }

  @Post('stripe-checkout')
  @HttpCode(200)
  async createCheckoutSession(
    @Body()
    dto: {
      priceId: string;
      userId: string;
      courseId?: string;
      successUrl: string;
      cancelUrl: string;
    },
  ) {
    const session = await this.stripeService.createCheckoutSession(dto);
    return { url: session.url, sessionId: session.id };
  }

  @Post('manual-submit')
  @UseInterceptors(FileInterceptor('receipt'))
  @HttpCode(201)
  async manualSubmit(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    dto: {
      userId: string;
      courseId?: string;
      amount: string;
      notes?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }

    const amount = parseFloat(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    return this.paymentsService.submitManualReceipt({
      userId: dto.userId,
      courseId: dto.courseId,
      amount,
      notes: dto.notes,
      file,
    });
  }
}
