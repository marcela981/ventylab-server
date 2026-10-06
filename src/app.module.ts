/*
 * Funcionalidad: Módulo raíz AppModule
 * Descripción: Compone la aplicación NestJS: configuración validada, i18n, throttling, Sentry, módulos comunes globales (persistencia, logging, contexto, eventos, tiempo real) y las features; registra el filtro global y los middlewares de traza y contexto
 * Versión: 1.13
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as path from "path";

import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SentryModule } from "@sentry/nestjs/setup";
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from "nestjs-i18n";

import { EnvironmentVariables, validate } from "@/common/infrastructure/config/env.validation";
import { DEFAULT_LANGUAGE } from "@/common/infrastructure/config/i18n.constants";
import { RequestContextModule } from "@/common/infrastructure/context/request-context.module";
import { EmailModule } from "@/common/infrastructure/email/email.module";
import { EventsModule } from "@/common/infrastructure/events/events.module";
import { HttpObservabilityModule } from "@/common/infrastructure/http/http-observability.module";
import { LoggingModule } from "@/common/infrastructure/logging/logging.module";
import { DatabaseModule } from "@/common/infrastructure/persistence/database.module";
import { RealtimeModule } from "@/common/infrastructure/realtime/realtime.module";
import { SecurityModule } from "@/common/infrastructure/security/security.module";
import { StorageModule } from "@/common/infrastructure/storage/storage.module";
import { HealthController } from "@/common/presentation/controllers/health.controller";
import { HttpExceptionFilter } from "@/common/presentation/filters/http-exception.filter";
import { RequestContextMiddleware } from "@/common/presentation/middlewares/request-context.middleware";
import { TraceIdMiddleware } from "@/common/presentation/middlewares/trace-id.middleware";
import { ActivitiesModule } from "@/features/activities/activities.module";
import { AdminModule } from "@/features/admin/admin.module";
import { AiModule } from "@/features/ai/ai.module";
import { AiRatingsModule } from "@/features/ai-ratings/ai-ratings.module";
import { AiTelemetryModule } from "@/features/ai-telemetry/ai-telemetry.module";
import { AiTutorModule } from "@/features/ai-tutor/ai-tutor.module";
import { AuthModule } from "@/features/auth/auth.module";
import { AuthorizationModule } from "@/features/authorization/authorization.module";
import { ChangeLogModule } from "@/features/changelog/changelog.module";
import { ClinicalCasesModule } from "@/features/clinical-cases/clinical-cases.module";
import { CurriculumModule } from "@/features/curriculum/curriculum.module";
import { CurriculumEditorModule } from "@/features/curriculum-editor/curriculum-editor.module";
import { EvaluationModule } from "@/features/evaluation/evaluation.module";
import { GroupsModule } from "@/features/groups/groups.module";
import { LessonsModule } from "@/features/lessons/lessons.module";
import { LevelsModule } from "@/features/levels/levels.module";
import { MediaModule } from "@/features/media/media.module";
import { ModulesModule } from "@/features/modules/modules.module";
import { NotesModule } from "@/features/notes/notes.module";
import { OverridesModule } from "@/features/overrides/overrides.module";
import { PagesModule } from "@/features/pages/pages.module";
import { ProgressModule } from "@/features/progress/progress.module";
import { QuizzesModule } from "@/features/quizzes/quizzes.module";
import { ScoresModule } from "@/features/scores/scores.module";
import { SectionsModule } from "@/features/sections/sections.module";
import { SimulationModule } from "@/features/simulation/simulation.module";
import { StepsModule } from "@/features/steps/steps.module";
import { TeacherStudentsModule } from "@/features/teacher-students/teacher-students.module";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      loaderOptions: {
        path: path.join(__dirname, "./i18n/"),
        watch: true,
      },
      resolvers: [
        new HeaderResolver(["x-lang"]),
        new QueryResolver(["lang"]),
        AcceptLanguageResolver,
      ],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>) => ({
        throttlers: [
          {
            ttl: configService.get("THROTTLE_TTL"),
            limit: configService.get("THROTTLE_LIMIT"),
          },
        ],
      }),
    }),
    DatabaseModule,
    LoggingModule,
    RequestContextModule,
    EmailModule,
    EventsModule,
    HttpObservabilityModule,
    SecurityModule,
    StorageModule,
    RealtimeModule,
    AuthModule,
    AuthorizationModule,
    UsersModule,
    ChangeLogModule,
    LevelsModule,
    ModulesModule,
    LessonsModule,
    StepsModule,
    PagesModule,
    SectionsModule,
    CurriculumModule,
    OverridesModule,
    CurriculumEditorModule,
    ProgressModule,
    QuizzesModule,
    ClinicalCasesModule,
    ActivitiesModule,
    GroupsModule,
    ScoresModule,
    MediaModule,
    NotesModule,
    TeacherStudentsModule,
    AdminModule,
    SimulationModule,
    EvaluationModule,
    AiTelemetryModule,
    AiRatingsModule,
    AiModule,
    AiTutorModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceIdMiddleware, RequestContextMiddleware).forRoutes("*");
  }
}
