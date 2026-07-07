package com.example.visitor.service;

import com.example.visitor.entity.Event;
import com.example.visitor.entity.EventPass;
import com.example.visitor.repository.EventPassRepository;
import com.example.visitor.repository.QRTableRepository;
import com.example.visitor.service.EventCsvService.EventPassRowDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Verifies the repeat-upload dedup contract: when a coordinator re-uploads the
 * same file with new members appended, only the brand-new members get a pass +
 * email — nobody who already received a pass is emailed again, regardless of
 * email casing or surrounding whitespace.
 */
@ExtendWith(MockitoExtension.class)
class EventCsvServiceReuploadTest {

    @Mock private EventPassRepository eventPassRepository;
    @Mock private QRTableRepository qrTableRepository;
    @Mock private EmailService emailService;

    @InjectMocks private EventCsvService service;

    private Event event;

    @BeforeEach
    void setUp() {
        event = new Event();
        event.setId(42L);
        event.setEventName("Tech Fest");
        event.setVenue("Auditorium");
        event.setEventDate(LocalDate.of(2026, 8, 1));
    }

    private EventPassRowDTO row(String name, String email) {
        EventPassRowDTO r = new EventPassRowDTO();
        r.fullName = name;
        r.email = email;
        r.collegeName = "RIT";
        r.phone = "9876543210";
        r.valid = true;
        return r;
    }

    /** save() must return the entity with an id so issueOne can build the QR string. */
    private void stubPassSaveWithIds() {
        AtomicLong seq = new AtomicLong(1000);
        when(eventPassRepository.save(any(EventPass.class))).thenAnswer(inv -> {
            EventPass p = inv.getArgument(0);
            if (p.getId() == null) p.setId(seq.incrementAndGet());
            return p;
        });
    }

    @Test
    void reupload_withNewMembers_onlyIssuesToNewMembers() {
        stubPassSaveWithIds();
        // Alice already has a pass for this event (stored lowercased, as issueOne writes it).
        when(eventPassRepository.findEmailsByEventId(42L))
            .thenReturn(new HashSet<>(Set.of("alice@x.edu")));

        // Second upload: same file with Bob newly added. Alice's casing/whitespace
        // differs from what's stored to prove the dedup is case/space-insensitive.
        List<EventPassRowDTO> rows = List.of(
            row("Alice", "  Alice@X.edu  "),
            row("Bob",   "bob@x.edu")
        );

        Map<String, Object> result = service.confirmUpload(event, rows, "STAFF01");

        assertEquals(2, result.get("total"));
        assertEquals(1, result.get("issued"),  "only the new member should be issued");
        assertEquals(1, result.get("skipped"), "the already-issued member should be skipped");
        assertEquals(0, result.get("failed"));

        // Exactly one email — to Bob, never to Alice.
        verify(emailService, times(1)).sendEventPassEmail(
            eq("bob@x.edu"), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        verify(emailService, never()).sendEventPassEmail(
            argThat(to -> to != null && to.toLowerCase().contains("alice")),
            anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void reupload_identicalFile_issuesNothing() {
        // Everyone in the file already has a pass — a pure re-upload of the same file.
        when(eventPassRepository.findEmailsByEventId(42L))
            .thenReturn(new HashSet<>(Set.of("alice@x.edu", "bob@x.edu")));

        List<EventPassRowDTO> rows = List.of(
            row("Alice", "alice@x.edu"),
            row("Bob",   "bob@x.edu")
        );

        Map<String, Object> result = service.confirmUpload(event, rows, "STAFF01");

        assertEquals(0, result.get("issued"));
        assertEquals(2, result.get("skipped"));
        verifyNoInteractions(emailService);
        // No pass rows persisted when everything is a duplicate.
        verify(eventPassRepository, never()).save(any(EventPass.class));
    }

    @Test
    void markDbDuplicates_flagsAlreadyIssuedRowsForPreview() {
        when(eventPassRepository.findEmailsByEventId(42L))
            .thenReturn(new HashSet<>(Set.of("alice@x.edu")));

        List<EventPassRowDTO> rows = new ArrayList<>(List.of(
            row("Alice", "ALICE@x.edu"),   // differs by case — must still match
            row("Bob",   "bob@x.edu")
        ));

        service.markDbDuplicates(42L, rows);

        assertTrue(rows.get(0).duplicate, "Alice already has a pass → duplicate");
        assertFalse(rows.get(0).valid,    "duplicate rows are excluded from confirm");
        assertFalse(rows.get(1).duplicate, "Bob is new → not a duplicate");
        assertTrue(rows.get(1).valid);
    }
}
