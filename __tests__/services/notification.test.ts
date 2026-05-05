import { NotificationService } from '@/modules/notification/service'
import prisma from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
}))

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch notifications and unread count', async () => {
    const mockUserId = 'user_1'
    const mockNotifications = [{ id: 'notif_1', userId: mockUserId, isRead: false }]

    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(1)

    const result = await NotificationService.getNotifications(mockUserId, 10)

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockUserId },
        take: 10,
      })
    )
    expect(prisma.notification.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockUserId, isRead: false },
      })
    )
    expect(result.items).toEqual(mockNotifications)
    expect(result.unreadCount).toEqual(1)
  })

  it('should mark all notifications as read', async () => {
    const mockUserId = 'user_1'
    await NotificationService.markAllAsRead(mockUserId)

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: mockUserId, isRead: false },
      data: { isRead: true },
    })
  })

  it('should mark a specific notification as read', async () => {
    const mockUserId = 'user_1'
    const mockNotifId = 'notif_1'
    await NotificationService.markAsRead(mockUserId, mockNotifId)

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: mockNotifId, userId: mockUserId },
      data: { isRead: true },
    })
  })
})
