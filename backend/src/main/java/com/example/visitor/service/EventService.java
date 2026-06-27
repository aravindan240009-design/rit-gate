package com.example.visitor.service;

import com.example.visitor.entity.Event;
import com.example.visitor.entity.EventCoordinator;
import com.example.visitor.entity.EventPass;
import com.example.visitor.repository.EventRepository;
import com.example.visitor.repository.EventCoordinatorRepository;
import com.example.visitor.repository.EventPassRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final EventCoordinatorRepository eventCoordinatorRepository;
    private final EventPassRepository eventPassRepository;
    private final NotificationService notificationService;

    @Transactional
    public Event createEvent(String hodCode, String eventName, LocalDate eventDate, String venue) {
        if (eventDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Event date must be today or in the future.");
        }
        Event event = new Event();
        event.setEventName(eventName.trim());
        event.setEventDate(eventDate);
        event.setVenue(venue != null ? venue.trim() : null);
        event.setStatus("ACTIVE");
        event.setCreatedByHod(hodCode);
        return eventRepository.save(event);
    }

    public Event getEvent(Long eventId) {
        return eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found: " + eventId));
    }

    public List<Event> getEventsForHod(String hodCode) {
        return eventRepository.findByCreatedByHodOrderByCreatedAtDesc(hodCode).stream()
            .filter(EventService::isNotPast)
            .collect(Collectors.toList());
    }

    /** An event is shown until the end of its event date; once the date has passed it is hidden. */
    private static boolean isNotPast(Event event) {
        LocalDate eventDate = event.getEventDate();
        return eventDate == null || !eventDate.isBefore(LocalDate.now());
    }

    @Transactional
    public List<Map<String, Object>> assignCoordinators(Long eventId, List<String> staffCodes, String hodCode) {
        Event event = getEvent(eventId);
        List<Map<String, Object>> results = new ArrayList<>();

        for (String staffCode : staffCodes) {
            if (eventCoordinatorRepository.existsByEventIdAndStaffCode(eventId, staffCode)) {
                results.add(Map.of("staffCode", staffCode, "status", "ALREADY_ASSIGNED"));
                continue;
            }
            EventCoordinator ec = new EventCoordinator();
            ec.setEventId(eventId);
            ec.setStaffCode(staffCode);
            ec.setAssignedBy(hodCode);
            ec.setAssignedAt(LocalDateTime.now());
            eventCoordinatorRepository.save(ec);

            try {
                notificationService.notifyStaffOfCoordinatorAssignment(
                    staffCode, event.getEventName(), event.getEventDate(), event.getVenue()
                );
            } catch (Exception e) {
                log.warn("Could not send coordinator notification to {}: {}", staffCode, e.getMessage());
            }
            results.add(Map.of("staffCode", staffCode, "status", "ASSIGNED"));
        }
        return results;
    }

    @Transactional
    public void removeCoordinator(Long eventId, String staffCode) {
        if (eventPassRepository.existsByEventId(eventId)) {
            throw new IllegalStateException("Cannot remove coordinator after CSV has been uploaded and confirmed for this event.");
        }
        if (!eventCoordinatorRepository.existsByEventIdAndStaffCode(eventId, staffCode)) {
            throw new RuntimeException("Coordinator assignment not found.");
        }
        eventCoordinatorRepository.deleteByEventIdAndStaffCode(eventId, staffCode);
    }

    public List<EventCoordinator> getCoordinatorsForEvent(Long eventId) {
        return eventCoordinatorRepository.findByEventId(eventId);
    }

    public List<Event> getEventsForCoordinator(String staffCode) {
        List<EventCoordinator> assignments = eventCoordinatorRepository.findByStaffCode(staffCode);
        List<Long> eventIds = assignments.stream().map(EventCoordinator::getEventId).collect(Collectors.toList());
        if (eventIds.isEmpty()) return List.of();
        return eventRepository.findAllById(eventIds).stream()
            .filter(EventService::isNotPast)
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .collect(Collectors.toList());
    }

    public boolean isCoordinator(Long eventId, String staffCode) {
        return eventCoordinatorRepository.existsByEventIdAndStaffCode(eventId, staffCode);
    }

    /**
     * Delete an event and everything attached to it (coordinator assignments + issued passes).
     * Only the HOD who created the event may delete it. Every assigned coordinator is notified
     * (in-app + device push) that the event has been cancelled before the records are removed.
     */
    @Transactional
    public void deleteEvent(Long eventId, String hodCode) {
        Event event = getEvent(eventId);
        if (!event.getCreatedByHod().equals(hodCode)) {
            throw new IllegalStateException("Only the creating HOD can delete this event.");
        }

        List<EventCoordinator> coordinators = eventCoordinatorRepository.findByEventId(eventId);
        for (EventCoordinator c : coordinators) {
            try {
                notificationService.notifyCoordinatorOfEventCancellation(
                    c.getStaffCode(), event.getEventName(), event.getEventDate());
            } catch (Exception e) {
                log.warn("Could not notify coordinator {} of event {} cancellation: {}",
                    c.getStaffCode(), eventId, e.getMessage());
            }
        }

        eventPassRepository.deleteByEventId(eventId);
        eventCoordinatorRepository.deleteByEventId(eventId);
        eventRepository.delete(event);
        log.info("HOD {} deleted event {} ({}) and notified {} coordinator(s)",
            hodCode, eventId, event.getEventName(), coordinators.size());
    }

    @Transactional
    public Event completeEvent(Long eventId, String hodCode) {
        Event event = getEvent(eventId);
        if (!event.getCreatedByHod().equals(hodCode)) {
            throw new IllegalStateException("Only the creating HOD can complete this event.");
        }
        event.setStatus("COMPLETED");
        return eventRepository.save(event);
    }
}
