// modules/storage/services/storageMonitor.service.ts
import { v2 as cloudinary } from 'cloudinary';
import { injectable } from 'tsyringe';

@injectable()
export class StorageMonitorService {
    async checkUsage(alertThreshold: number = 0.9) {
        const { used_bytes, plan_limit } = await cloudinary.api.usage();

        const usagePercentage = used_bytes / plan_limit;
        if (usagePercentage >= alertThreshold) {
            this.triggerAlert(usagePercentage);
        }

        return {
            used: this.bytesToGB(used_bytes),
            limit: this.bytesToGB(plan_limit),
            percentage: Math.round(usagePercentage * 100)
        };
    }

    private triggerAlert(percentage: number) {
        // Integrar con: Slack, Email, SMS, etc.
        console.error(`🚨 Almacenamiento al ${Math.round(percentage * 100)}%`);
    }

    private bytesToGB(bytes: number) {
        return +(bytes / (1024 ** 3)).toFixed(2);
    }
}