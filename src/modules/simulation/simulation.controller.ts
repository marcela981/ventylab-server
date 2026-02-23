/**
 * @module SimulationController
 * @description REST endpoints for the simulation module.
 *
 * All routes require authentication (Bearer JWT).
 * The router is created via a factory that receives the already-initialised
 * SimulationService as a dependency, keeping the controller free of wiring logic.
 *
 * Routes:
 *   GET    /api/simulation/status         → ventilator status (MQTT + reservation + alarms)
 *   POST   /api/simulation/command        → send a command to the physical ventilator
 *   POST   /api/simulation/reserve        → reserve the physical ventilator
 *   DELETE /api/simulation/reserve        → release the current reservation
 *   POST   /api/simulation/session/save   → persist a simulation session
 *   GET    /api/simulation/sessions       → list authenticated user's saved sessions
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { SimulationService } from './simulation.service';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSimulationController(service: SimulationService): Router {
  const router = Router();

  // All simulation endpoints require a valid JWT.
  router.use(authenticate);

  // -------------------------------------------------------------------------
  // GET /api/simulation/status
  // Returns: { success, data: GetVentilatorStatusResponse }
  // Optional query param: ?deviceId=<id>
  // -------------------------------------------------------------------------
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string | undefined;
      const data = await service.getVentilatorStatus(deviceId);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[SimulationController] GET /status error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // POST /api/simulation/command
  // Body: { command: VentilatorCommand }
  // Returns: SendCommandResponse  (success:true or success:false + errors[])
  // -------------------------------------------------------------------------
  router.post('/command', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;

      if (!command || typeof command !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Body must include a "command" object',
        });
      }

      const userId = req.user?.id;
      const result = await service.sendCommand({ command, userId });

      // 422 Unprocessable Entity when the command itself fails validation
      const statusCode = result.success ? 200 : 422;
      res.status(statusCode).json(result);
    } catch (error: any) {
      console.error('[SimulationController] POST /command error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // POST /api/simulation/reserve
  // Body: { durationMinutes: number, purpose?: string }
  // Returns: ReserveVentilatorResponse
  // -------------------------------------------------------------------------
  router.post('/reserve', async (req: Request, res: Response) => {
    try {
      const { durationMinutes, purpose } = req.body;

      if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
        return res.status(400).json({
          success: false,
          message: '"durationMinutes" must be a positive number',
        });
      }

      const userId = req.user!.id;
      const result = await service.reserveVentilator({ userId, durationMinutes, purpose });

      // Return 409 Conflict when ventilator is already reserved by someone else
      const statusCode = result.success ? 200 : 409;
      res.status(statusCode).json(result);
    } catch (error: any) {
      console.error('[SimulationController] POST /reserve error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // DELETE /api/simulation/reserve
  // Returns: { success: true, message }
  // -------------------------------------------------------------------------
  router.delete('/reserve', async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await service.releaseVentilator(userId);
      res.json({ success: true, message: 'Reservation released' });
    } catch (error: any) {
      const isNotFound = error.message.includes('No active reservation');
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // -------------------------------------------------------------------------
  // POST /api/simulation/session/save
  // Body: SaveSimulatorSessionRequest (minus userId, which comes from JWT)
  // Returns: SaveSimulatorSessionResponse
  // -------------------------------------------------------------------------
  router.post('/session/save', async (req: Request, res: Response) => {
    try {
      const { isRealVentilator, parametersLog, ventilatorData, notes, clinicalCaseId } = req.body;

      if (!Array.isArray(parametersLog)) {
        return res.status(400).json({
          success: false,
          message: '"parametersLog" must be an array',
        });
      }
      if (!Array.isArray(ventilatorData)) {
        return res.status(400).json({
          success: false,
          message: '"ventilatorData" must be an array',
        });
      }

      const userId = req.user!.id;
      const result = await service.saveSession({
        userId,
        isRealVentilator: isRealVentilator ?? false,
        parametersLog,
        ventilatorData,
        notes,
        clinicalCaseId,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('[SimulationController] POST /session/save error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/simulation/sessions
  // Optional query param: ?limit=<n>
  // Returns: { success, data: SimulatorSession[], count }
  //
  // Note: returns sessions for the authenticated user only.
  // -------------------------------------------------------------------------
  router.get('/sessions', async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;

      if (limit !== undefined && (isNaN(limit) || limit < 1)) {
        return res.status(400).json({
          success: false,
          message: '"limit" must be a positive integer',
        });
      }

      const data = await service.getUserSessions(userId, limit);
      res.json({ success: true, data, count: data.length });
    } catch (error: any) {
      console.error('[SimulationController] GET /sessions error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
