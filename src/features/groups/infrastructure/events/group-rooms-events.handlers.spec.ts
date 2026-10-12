/*
 * Funcionalidad: Pruebas de GroupRoomsEventsHandlers
 * Descripción: Verifica que al autenticarse un socket el usuario entre a la sala group:{id} de cada grupo del que es miembro, que entre o salga de la sala al agregarlo o quitarlo de un grupo y que la sala se vacíe al eliminar el grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { type IRealtimePublisher } from "@/common/application/ports/realtime-publisher.interface";
import { buildGroup, buildMember } from "@/features/groups/application/testing/groups-test-doubles-spec";
import { GroupMemberAddedEvent, GroupMemberRemovedEvent } from "@/features/groups/domain/events/group-member.events";
import { GroupDeletedEvent } from "@/features/groups/domain/events/group.events";
import { type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { GroupRoomsEventsHandlers } from "@/features/groups/infrastructure/events/group-rooms-events.handlers";

interface Doubles {
  handlers: GroupRoomsEventsHandlers;
  publisher: jest.Mocked<Pick<IRealtimePublisher, "joinRoom" | "leaveRoom" | "clearRoom">>;
  getGroupIdsForUser: jest.Mock<Promise<string[]>, [string]>;
}

function buildHandlers(groupIds: string[] | Error = []): Doubles {
  const getGroupIdsForUser: jest.Mock<Promise<string[]>, [string]> = jest.fn(
    (_userId: string): Promise<string[]> => (groupIds instanceof Error ? Promise.reject(groupIds) : Promise.resolve(groupIds)),
  );
  const publisher: jest.Mocked<Pick<IRealtimePublisher, "joinRoom" | "leaveRoom" | "clearRoom">> = {
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    clearRoom: jest.fn(),
  };
  const repository: IGroupsRepository = { getGroupIdsForUser } as unknown as IGroupsRepository;

  return {
    handlers: new GroupRoomsEventsHandlers(repository, publisher as unknown as IRealtimePublisher),
    publisher,
    getGroupIdsForUser,
  };
}

describe("GroupRoomsEventsHandlers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("joins the room of every group the user belongs to when a socket authenticates", async () => {
    const { handlers, publisher, getGroupIdsForUser }: Doubles = buildHandlers(["group-1", "group-2"]);

    await handlers.handleClientAuthenticated({ userId: "student-1", role: "STUDENT", socketId: "socket-1" });

    expect(getGroupIdsForUser).toHaveBeenCalledWith("student-1");
    expect(publisher.joinRoom).toHaveBeenCalledTimes(2);
    expect(publisher.joinRoom).toHaveBeenCalledWith("student-1", "group:group-1");
    expect(publisher.joinRoom).toHaveBeenCalledWith("student-1", "group:group-2");
  });

  it("joins no room when the user belongs to no group", async () => {
    const { handlers, publisher }: Doubles = buildHandlers([]);

    await handlers.handleClientAuthenticated({ userId: "teacher-1", role: "TEACHER", socketId: "socket-1" });

    expect(publisher.joinRoom).not.toHaveBeenCalled();
  });

  it("logs and swallows a lookup failure so authentication is never affected", async () => {
    const warn: jest.SpyInstance = jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
    const { handlers, publisher }: Doubles = buildHandlers(new Error("database unavailable"));

    await expect(handlers.handleClientAuthenticated({ userId: "student-1", role: "STUDENT", socketId: "socket-1" })).resolves.toBeUndefined();

    expect(publisher.joinRoom).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("joins the group room when a member is added", () => {
    const { handlers, publisher }: Doubles = buildHandlers();

    handlers.handleMemberAdded(new GroupMemberAddedEvent({ entity: buildMember({ groupId: "group-3", userId: "student-2" }) }));

    expect(publisher.joinRoom).toHaveBeenCalledWith("student-2", "group:group-3");
  });

  it("leaves the group room when a member is removed", () => {
    const { handlers, publisher }: Doubles = buildHandlers();

    handlers.handleMemberRemoved(new GroupMemberRemovedEvent({ entity: buildMember({ groupId: "group-3", userId: "student-2" }) }));

    expect(publisher.leaveRoom).toHaveBeenCalledWith("student-2", "group:group-3");
  });

  it("clears the group room when the group is deleted", () => {
    const { handlers, publisher }: Doubles = buildHandlers();

    handlers.handleGroupDeleted(new GroupDeletedEvent({ entity: buildGroup({ id: "group-4" }) }));

    expect(publisher.clearRoom).toHaveBeenCalledWith("group:group-4");
  });
});
