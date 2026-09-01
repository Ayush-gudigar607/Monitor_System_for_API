import AppError from "../../../shared/utils/AppError.js";

export class AnalyticController {
  constructor({
    analyticsService: analyticsService,
    authService: authService,
    clientRepository: clientRepository,
  } = {}) {
    if (!analyticsService || !authService || !clientRepository)
      throw new Error(
        "AnalyticsContainer requires analyticsService, authService and clientRepository",
      );
    this.analyticsService = analyticsService;
    this.authService = authService;
    this.clientRepository = clientRepository;
  }

  validateTimeRange(startTime, endTime) {
    const parseValue = (v) => {
      if (v === undefined || v === null || v === "") return null;
      if (/^\d+$/.test(String(v))) return Number(v);
      const parsed = Date.parse(String(v));
      return Number.isNaN(parsed) ? NaN : parsed;
    };

    const start = parseValue(startTime);
    const end = parseValue(endTime);

    if ((startTime && Number.isNaN(start)) || (endTime && Number.isNaN(end))) {
      throw new AppError(
        "Invalid time format. Must be a timestamp or date string.",
        400,
      );
    }

    if (start !== null && end !== null) {
      throw new AppError("start and end cannot be null values", 400);
    }

    if (start > end) {
      throw new AppError("start time cannot be greater than end time", 400);
    }

    return { startTime: start, endTime: end };
  }

  isValidObjectId(id) {
    return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
  }

  async getStatus(req, res, next) {
    try {
      const { startTime, endTime } = req.query;
      const clientId = req.clientId;

      const isAdmin = await this.ensureCanViewAnalytics(req);
      const finalCientId = await this.resolveFinalClientID(req, isAdmin);
      const timeRange = this.validateTimeRange(startTime, endTime);

      const stats = await this.analyticsService.getOverallStats(
        finalCientId,
        timeRange,
      );
      res
        .status(200)
        .json(
          ResponseFormatter.success(
            stats,
            "Analytics stats retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async ensureCanViewAnalytics(req) {
    if (!req.user || !req.user.userId) {
      throw new AppError("Unauthorized", 401);
    }

    const isSuperAdmin = await this.authService.isSuperAdmin(req.user.userId);

    if (isSuperAdmin) {
      return true;
    }
    //if not super admin, check if user has CanViewAnalytics permission
    const profile = await this.authService.getUserProfile(req.user.userId);

    if (
      !profile ||
      !profile.permissions ||
      !profile.permissions.CanViewAnalytics
    ) {
      throw new AppError(
        "Forbidden: You do not have permission to view analytics",
        403,
      );
    }
    return false;
  }

  async resolveFinalClientID(req, isAdmin) {
    const queryClientId = req.query.clientId;
    const userClientId = req.user?.clientId;

    if (isAdmin) {
      if (queryClientId) {
        if (!this.isValidObjectId(queryClientId)) {
          throw new AppError("Invalid clientId format", 400);
        }

        const clientId = await this.clientRepository.findById(queryClientId);
        if (!clientId) throw new AppError("Client not found", 404);
        return queryClientId;
      }
      return null; // No client filter for super admins
    }

    if (!userClientId) {
      throw new AppError("User does not belong to any client", 400);
    }

    if (!this.isValidObjectId(userClientId)) {
      throw new AppError("Invalid user clientId format", 400);
    }

    return userClientId;
  }

  async getDashboard(req, res, next) {
    try {
      const { startTime, endTime } = req.query;
      const clientId = req.clientId;

      const isSuperAdmin = await this.ensureCanViewAnalytics(req);
      const finalClientId = await this.resolveFinalClientID(req, isSuperAdmin);
      const timeRange = this.validateTimeRange(startTime, endTime);

      const result = await Promise.allSettled([
        this.analyticsService.getOverallStats(finalClientId, timeRange),
        this.analyticsService.getTopEndpoints(finalClientId, {
          limit: 5,
          startTime: timeRange.startTime,
        }),
        this.analyticsService.getTimeSeries(finalClientId, {
          ...timeRange,
          limit: 24,
        }),
      ]);

      const [stats, topEndpoints, timeSeries] = result.map((r) =>
        r.status === "fulfilled" ? r.value : null,
      );

      const dashboardData = {
        stats,
        topEndpoints,
        timeSeries,
      };
      res
        .status(200)
        .json(
          ResponseFormatter.success(
            dashboardData,
            "Dashboard data retrieved successfully",
          ),
        );
    } catch (err) {
      next(err);
    }
  }
}
