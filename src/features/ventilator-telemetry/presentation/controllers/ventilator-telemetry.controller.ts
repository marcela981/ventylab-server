/*
 * Funcionalidad: Controlador VentilatorTelemetryController
 * Descripción: Endpoints de la telemetría del ventilador físico: métricas del pipeline en JSON y CSV y su reinicio (solo administradores, permiso ventilator:metrics), inicio y fin de la grabación de la reserva activa y lectura de la grabación de una reserva (titulares, docentes o administradores)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { toCsv } from "@/common/presentation/utils/csv.util";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GetTelemetryRecordingCommand, TelemetryRecordingCommand } from "@/features/ventilator-telemetry/application/commands/telemetry-recording.command";
import { type TelemetryRecordingResult } from "@/features/ventilator-telemetry/application/results/telemetry-recording.result";
import { GetTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/get-telemetry-recording.usecase";
import { StartTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/start-telemetry-recording.usecase";
import { StopTelemetryRecordingUseCase } from "@/features/ventilator-telemetry/application/use-cases/stop-telemetry-recording.usecase";
import {
  GetTelemetryMetricSamplesUseCase,
  GetTelemetryMetricsUseCase,
  ResetTelemetryMetricsUseCase,
} from "@/features/ventilator-telemetry/application/use-cases/telemetry-metrics.usecases";
import { TelemetryMetricsDTO, TelemetryRecordingDTO } from "@/features/ventilator-telemetry/presentation/dtos/ventilator-telemetry.dto";
import { VentilatorTelemetryMapper } from "@/features/ventilator-telemetry/presentation/mappers/ventilator-telemetry.mapper";
import {
  TELEMETRY_METRIC_CSV_COLUMNS,
  TELEMETRY_METRICS_CSV_FILENAME,
} from "@/features/ventilator-telemetry/presentation/utils/telemetry-metrics-csv.columns";

@ApiTags("Ventilator telemetry")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api/ventilator/telemetry")
export class VentilatorTelemetryController {
  public constructor(
    private readonly _getTelemetryMetricsUseCase: GetTelemetryMetricsUseCase,
    private readonly _getTelemetryMetricSamplesUseCase: GetTelemetryMetricSamplesUseCase,
    private readonly _resetTelemetryMetricsUseCase: ResetTelemetryMetricsUseCase,
    private readonly _startTelemetryRecordingUseCase: StartTelemetryRecordingUseCase,
    private readonly _stopTelemetryRecordingUseCase: StopTelemetryRecordingUseCase,
    private readonly _getTelemetryRecordingUseCase: GetTelemetryRecordingUseCase,
  ) {}

  @Get("metrics")
  @RequirePermissions("ventilator:metrics")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Ventilator telemetry metrics",
    description: "In-memory pipeline metrics: messages and batches per second, invalid and lost messages, volatile emits and p50/p95/p99 of processing, total (including the batching wait), flush and device-to-server latency",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Metrics retrieved successfully", type: TelemetryMetricsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getTelemetryMetrics(@I18n() i18n: I18nContext): Promise<APIResponse<TelemetryMetricsDTO>> {
    return new APIResponseBuilder<TelemetryMetricsDTO>()
      .setData(VentilatorTelemetryMapper.toMetricsDTO(this._getTelemetryMetricsUseCase.execute()))
      .setMessage(await i18n.t("ventilator-telemetry.metrics_retrieved"))
      .build();
  }

  @Get("metrics.csv")
  @RequirePermissions("ventilator:metrics")
  @ApiProduces("text/csv")
  @ApiOperation({ summary: "Export ventilator telemetry latency samples as CSV", description: "One RFC 4180 row per retained latency sample: kind,valueMs,recordedAt" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "CSV file" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public exportTelemetryMetricsCsv(@Res() response: Response): void {
    const csv: string = toCsv(VentilatorTelemetryMapper.toCsvRows(this._getTelemetryMetricSamplesUseCase.execute()), TELEMETRY_METRIC_CSV_COLUMNS);

    response.status(HttpStatus.OK);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${TELEMETRY_METRICS_CSV_FILENAME}"`);
    response.send(csv);
  }

  @Post("metrics/reset")
  @RequirePermissions("ventilator:metrics")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset ventilator telemetry metrics", description: "Clears counters, rates and latency buffers" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Metrics reset successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async resetTelemetryMetrics(@I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    this._resetTelemetryMetricsUseCase.execute();

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-telemetry.metrics_reset"))
      .build();
  }

  @Post("recordings/start")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Start recording the ventilator telemetry",
    description: "Records the active reservation's telemetry, subsampled to VENTILATOR_RECORDING_HZ, in gzip-json chunks; allowed to the reservation holders, teachers and administrators. Stops automatically when the reservation ends or is preempted",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Recording started" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not a holder of the active reservation" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "No active reservation" })
  public async startTelemetryRecording(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._startTelemetryRecordingUseCase.execute(new TelemetryRecordingCommand({ userId: currentUser.sub, role: currentUser.role }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-telemetry.recording_started"))
      .build();
  }

  @Post("recordings/stop")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stop recording the ventilator telemetry", description: "Stops the running recording and stores its last chunk" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Recording stopped" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not a holder of the active reservation" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "No active reservation" })
  public async stopTelemetryRecording(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._stopTelemetryRecordingUseCase.execute(new TelemetryRecordingCommand({ userId: currentUser.sub, role: currentUser.role }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("ventilator-telemetry.recording_stopped"))
      .build();
  }

  @Get("recordings/:reservationId")
  @RequirePermissions("simulation:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a telemetry recording", description: "Decompressed frames of a reservation ordered by server time; allowed to the reservation holders, teachers and administrators" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Recording retrieved successfully", type: TelemetryRecordingDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not a holder of the reservation" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Reservation not found" })
  public async getTelemetryRecording(
    @Param("reservationId") reservationId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<TelemetryRecordingDTO>> {
    const result: TelemetryRecordingResult = await this._getTelemetryRecordingUseCase.execute(
      new GetTelemetryRecordingCommand({ reservationId, userId: currentUser.sub, role: currentUser.role }),
    );

    return new APIResponseBuilder<TelemetryRecordingDTO>()
      .setData(VentilatorTelemetryMapper.toRecordingDTO(result))
      .setMessage(await i18n.t("ventilator-telemetry.recording_retrieved"))
      .build();
  }
}
